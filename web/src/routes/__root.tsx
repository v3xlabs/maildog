import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export const Route = createRootRoute({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <div className="w-full h-screen flex flex-col overflow-y-hidden">
                <div className="flex-1 h-full flex">
                    <div className="w-full overflow-y-auto">
                        <Outlet />
                    </div>
                </div>
            </div>
            <Toaster position="bottom-right" richColors />
        </QueryClientProvider>
    ),
});
