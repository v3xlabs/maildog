import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { createRootRoute, Outlet } from "@tanstack/solid-router";

import { Toaster } from "@/components/ui/Toast";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <div class="w-full h-screen flex flex-col overflow-y-hidden">
        <div class="flex-1 h-full flex">
          <div class="w-full overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  ),
});
