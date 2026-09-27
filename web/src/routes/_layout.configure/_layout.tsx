import { createFileRoute, Outlet } from '@tanstack/solid-router';

export const Route = createFileRoute('/_layout/configure/_layout')({
    component: () => (
        <div
            class="p-2 w-full h-full pt-4 md:pt-32"
            // style={{
            //     backgroundImage:
            //         'linear-gradient(to right top, #af0917, #bc161b, #c9201f, #d72924, #e43228)',
            // }}
        >
            <div class="max-w-lg mx-auto space-y-2">
                <h1 class="text-2xl font-bold text-text-secondary">
                    Configuration
                </h1>
                <div class="border border-border bg-card-background p-4 rounded-lg h-fit space-y-2 w-full ">
                    <Outlet />
                </div>
            </div>
        </div>
    ),
});
