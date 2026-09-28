import { createLazyFileRoute } from "@tanstack/solid-router";
import { Errored, Loading, Show } from "solid-js";

import { useImapConfigs } from "@/api/imapConfig";
import { AppView } from "@/components/AppView";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { Button } from "@/components/ui/Button";

const component = () => {
  const configs = useImapConfigs();

  return (
    <Errored
      fallback={(_error, reset) => (
        <div class="w-full h-full flex items-center justify-center">
          <div class="text-center space-y-4">
            <p class="text-red-600">
              Could not load your accounts:
              {" "}
              {configs.error?.message}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                void configs.refetch();
                reset();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    >
      <Loading
        fallback={(
          <div class="w-full h-full flex items-center justify-center">
            <div class="text-center space-y-4">
              <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p class="text-gray-600">Loading Maildog...</p>
            </div>
          </div>
        )}
      >
        <Show
          when={configs.data?.configs.length}
          fallback={<OnboardingFlow />}
        >
          <AppView />
        </Show>
      </Loading>
    </Errored>
  );
};

export const Route = createLazyFileRoute("/_layout/")({
  component,
});
