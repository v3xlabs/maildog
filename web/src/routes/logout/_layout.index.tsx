import { useQuery } from '@tanstack/solid-query';
import { createFileRoute } from '@tanstack/solid-router';
import LoaderIcon from '~icons/lucide/loader';
import { Loading, Match, Show, Switch } from 'solid-js';

import { buttonVariants } from '@/components/ui/Button';
import { instanceUrl } from '@/utils/instanceConfig';

const component = () => {
    const authUrl = useQuery(() => ({
        queryKey: ['auth_url'],
        queryFn: async () => {
            const response = await fetch(instanceUrl() + '/auth/uri');

            return (await response.json()) as { url: string };
        },
        retry: true,
        // refetchInterval: 5000,
        retryDelay: 5000,
    }));

    return (
        <>
            <h1 class="h2">Your Inbox Page</h1>
            <p>Welcome to the last inbox you'll ever need</p>
            <div class="flex flex-col gap-2">
                <Switch fallback={<div>Something went wrong</div>}>
                    <Match when={authUrl.isSuccess}>
                        <Loading>
                            <a href={authUrl.data?.url} class={buttonVariants()}>
                                Authenticate
                            </a>
                        </Loading>
                    </Match>
                    <Match when={authUrl.isError}>
                        <div class="text-red-500 bg-red-500/5 p-4 flex items-center justify-between">
                            <span>Instance is unreachable</span>
                            <Show when={authUrl.isLoading || authUrl.isRefetching}>
                                <span>
                                    <LoaderIcon class="animate-spin" />
                                </span>
                            </Show>
                        </div>
                    </Match>
                    <Match when={authUrl.isLoading}>
                        <div>Connecting...</div>
                    </Match>
                </Switch>
            </div>
            <input
                type="text"
                name="username"
                class="hidden"
                autocomplete="username webauthn"
            />
            <div>
                Developed by{' '}
                <a href="https://v3x.company" class="link" target="_blank">
                    V3X Labs
                </a>
            </div>
        </>
    );
};

export const Route = createFileRoute('/logout/_layout/')({
    component,
});
