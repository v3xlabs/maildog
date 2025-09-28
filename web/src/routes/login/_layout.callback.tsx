import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useElapsedTime } from 'use-elapsed-time';

import { useInstanceConfig } from '../../hooks/useInstanceConfig';

export const Route = createFileRoute('/login/_layout/callback')({
    component: () => {
        // extract the session_state, code, state from the url
        const url = new URL(window.location.href);
        const session_state = url.searchParams.get('session_state');
        const iss = url.searchParams.get('iss');
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        const { instance_url } = useInstanceConfig();
        const { data: auth_token, error } = useQuery({
            queryKey: ['auth_token'],
            retry: false,
            queryFn: async () => {
                const response = await fetch(instance_url + '/auth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        state,
                        session_state,
                        iss,
                    }),
                });

                return (await response.json()) as {
                    access_token: string;
                };
            },
        });
        const { data: me } = useQuery({
            queryKey: ['me'],
            queryFn: async () => {
                const response = await fetch(instance_url + '/auth/me', {
                    headers: {
                        Authorization: `Bearer ${auth_token?.access_token}`,
                    },
                    credentials: 'include',
                });

                return (await response.json()) as {
                    user: {};
                };
            },
            enabled: !!auth_token,
        });
        const { mutate } = useMutation({
            mutationFn: async () => {
                const response = await fetch(instance_url + '/auth/logout', {
                    headers: {
                        Authorization: `Bearer ${auth_token?.access_token}`,
                    },
                    credentials: 'include',
                });

                return (await response.json()) as {
                    status: string;
                };
            },
        });

        const { elapsedTime } = useElapsedTime({
            isPlaying: true,
            updateInterval: 1,
            duration: 5,
        });

        return (
            <div className="space-y-4">
                <div>
                    {elapsedTime >= 5 ? 'Still processing' : 'Processing'} your
                    sign-in request...
                </div>
                {elapsedTime >= 5 && (
                    <>
                        <hr />
                        <h2 className="h2">Debug Information</h2>
                        <p>
                            The sign in process is taking longer than expected.
                            Here is some debug information:
                        </p>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-x-scroll">
                            <div>session_state: {session_state}</div>
                            <div>iss: {iss}</div>
                            <div>code: {code}</div>
                            <div>state: {state}</div>
                        </pre>
                        <hr />
                        <p>
                            If you are not redirected, please click{' '}
                            <a href="/login" className="link">
                                here
                            </a>
                        </p>
                    </>
                )}
                {error && (
                    <div className="text-red-500 bg-red-100 p-4 rounded-md">
                        <p>{error.message}</p>

                        <a href="/login" className="button">
                            Return to login
                        </a>
                    </div>
                )}
                {auth_token && (
                    <div>
                        <h2 className="h2">Auth Token</h2>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-x-scroll">
                            {JSON.stringify(auth_token, undefined, 2)}
                        </pre>
                    </div>
                )}
                {me && (
                    <div>
                        <h2 className="h2">Me</h2>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-x-scroll">
                            {JSON.stringify(me, undefined, 2)}
                        </pre>
                        <button onClick={() => mutate()}>Logout</button>
                    </div>
                )}
            </div>
        );
    },
});
