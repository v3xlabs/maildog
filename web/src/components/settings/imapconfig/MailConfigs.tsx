import RefreshCcwIcon from '~icons/lucide/refresh-ccw';
import { Errored, For, Loading } from 'solid-js';

import { useImapConfigs } from '@/api';
import { Button } from '@/components/ui/Button';

import { AddImapConfigButton } from './AddImapConfig';
import { EditImapConfigButton } from './EditImapConfig';

export const MailConfigSettings = () => {
    const configs = useImapConfigs();

    return (
        <div class="card space-y-2">
            <div class="px-4 py-2 border-b">
                <h2 class="text-lg font-medium">Accounts</h2>
                <p class="text-sm text-gray-500">Setup your mail accounts</p>
            </div>
            <div class="px-4">
                <table class="w-full text-sm">
                    <thead>
                        <tr>
                            <th class="text-left">ID</th>
                            <th class="text-left">Name</th>
                            <th class="text-left">Username</th>
                            <th class="text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <Errored
                            fallback={
                                <tr>
                                    <td colspan={4} class="py-2 text-red-600">
                                        Could not load accounts:{' '}
                                        {configs.error?.message}
                                    </td>
                                </tr>
                            }
                        >
                        <Loading
                            fallback={
                                <tr>
                                    <td colspan={4} class="py-2 text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            }
                        >
                            <For each={configs.data?.configs}>
                                {(config) => (
                                    <tr class="border-b last:border-b-0 px-2">
                                        <td>#{config.id}</td>
                                        <td>{config.name}</td>
                                        <td>{config.username}</td>
                                        <td class="py-0.5">
                                            <EditImapConfigButton config={config} />
                                            <Button variant="secondary" size="xs">
                                                <RefreshCcwIcon />
                                            </Button>
                                        </td>
                                    </tr>
                                )}
                            </For>
                        </Loading>
                        </Errored>
                    </tbody>
                </table>
            </div>
            <div class="flex justify-end border-t p-2">
                <AddImapConfigButton />
            </div>
        </div>
    );
};
