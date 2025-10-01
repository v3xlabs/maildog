/* eslint-disable sonarjs/no-duplicate-string */
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { FiLoader } from 'react-icons/fi';
import { match } from 'ts-pattern';

import { Button } from '../../components/ui/Button';
import { useInstanceConfig } from '../../hooks/useInstanceConfig';
import { ConnectionSettings } from '../../components/connection/ConnectionSettings';

const component = () => {
    const { instance_url } = useInstanceConfig();
    const {
        data: auth_url,
        isError,
        isLoading,
        isRefetching,
        isSuccess,
        error,
    } = useQuery({
        queryKey: ['auth_url'],
        queryFn: async () => {
            const response = await fetch(instance_url + '/auth/uri');

            return (await response.json()) as { url: string };
        },
        retry: 1,
        refetchInterval: 10000,
    });

    return (
        <>
            <div className="flex justify-between items-center">
                <h1 className="h2">Maildog</h1>
                <ConnectionSettings />
            </div>
            <p>Welcome to the last inbox you'll ever need</p>
            {isRefetching && <div>Refetching...</div>}
            <div className="flex flex-col gap-2">
                {match({
                    error,
                    isSuccess,
                    isError,
                    isLoading,
                    isRefetching,
                })
                    .with({ isSuccess: true }, () => (
                        <Button asChild>
                            <Link to={auth_url?.url}>Authenticate</Link>
                        </Button>
                    ))
                    .with({ isError: true }, () => (
                        <div className="text-red-500 bg-red-500/5 p-4 flex items-center justify-between">
                            <span>Instance is unreachable</span>
                            {(isLoading || isRefetching) && (
                                <span>
                                    <FiLoader className="animate-spin" />
                                </span>
                            )}
                        </div>
                    ))
                    .with({ isLoading: true, isError: false, isRefetching: false }, () => (
                        <div>Connecting...</div>
                    ))
                    .otherwise(() => (
                        <div>Something went wrong</div>
                    ))}
            </div>
            <input
                type="text"
                name="username"
                className="hidden"
                autoComplete="username webauthn"
            />
            <div>
                Developed by{' '}
                <a href="https://v3x.company" className="link" target="_blank">
                    V3X Labs
                </a>
            </div>
        </>
    );
};

export const Route = createFileRoute('/login/_layout/')({
    component,
});
