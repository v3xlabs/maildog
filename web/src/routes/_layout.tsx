import { createFileRoute, Outlet } from '@tanstack/react-router';

import { Sidebar } from '@/components/sidebar';

export const Route = createFileRoute('/_layout')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex h-full bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
