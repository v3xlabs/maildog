import { createFileRoute, Outlet } from '@tanstack/solid-router';

import { requireInstanceUrl } from '@/utils/instanceConfig';

export const Route = createFileRoute('/login/_layout')({
    beforeLoad: requireInstanceUrl,
    component: () => (
        <div class="p-2 w-full h-full flex justify-center pt-4 md:pt-32">
            <div class="border p-4 rounded-lg h-fit space-y-2 w-full max-w-md">
                <Outlet />
            </div>
        </div>
    ),
});
