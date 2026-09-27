import { createFileRoute, Link } from '@tanstack/solid-router';
import { For } from 'solid-js';

import { instanceUrl } from '@/utils/instanceConfig';

const checks = [
    { label: 'Testing connectivity', status: 'z' },
    { label: 'Testing something else', status: 'z' },
];

export const Route = createFileRoute(
    '/_layout/configure/_layout/instance/healthcheck'
)({
    component: () => (
        <div class="space-y-4">
            <div>
                Connecting to <span>{instanceUrl()}</span>
            </div>
            <ul class="w-full">
                <For each={checks}>
                    {(check) => (
                        <li class="flex justify-between items-center w-full">
                            <span>{check.label}</span>
                            <span>{check.status}</span>
                        </li>
                    )}
                </For>
            </ul>
            <div class="w-full h-[1px] bg-border"></div>
            <div>
                <Link to="/configure/instance">Return to previous step</Link>
            </div>
        </div>
    ),
});
