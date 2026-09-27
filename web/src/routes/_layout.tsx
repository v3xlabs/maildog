import { createFileRoute, Outlet } from '@tanstack/solid-router';

import { Sidebar } from '@/components/sidebar';

export const Route = createFileRoute('/_layout')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div class="flex h-full bg-background">
            <Sidebar />

            <main class="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
