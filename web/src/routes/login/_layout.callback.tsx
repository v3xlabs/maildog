import { useMutation, useQuery } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, onCleanup, Show } from "solid-js";

import { instanceUrl } from "@/utils/instanceConfig";

const slowSignInDelayMs = 5000;

export const Route = createFileRoute("/login/_layout/callback")({
  component: () => {
    // extract the session_state, code, state from the url
    const url = new URL(globalThis.location.href);
    const session_state = url.searchParams.get("session_state");
    const iss = url.searchParams.get("iss");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const authToken = useQuery(() => ({
      queryKey: ["auth_token"],
      retry: false,
      queryFn: async () => {
        const response = await fetch(instanceUrl() + "/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            state,
            session_state,
            iss,
          }),
        });

        return (await response.json()) as {
          access_token: string;
        };
      },
    }));
    const me = useQuery(() => ({
      queryKey: ["me"],
      queryFn: async () => {
        const response = await fetch(instanceUrl() + "/auth/me", {
          headers: {
            Authorization: `Bearer ${authToken.data?.access_token}`,
          },
          credentials: "include",
        });

        return (await response.json()) as {
          user: object;
        };
      },
      enabled: authToken.isSuccess,
    }));
    const logout = useMutation(() => ({
      mutationFn: async () => {
        const response = await fetch(instanceUrl() + "/auth/logout", {
          headers: {
            Authorization: `Bearer ${authToken.data?.access_token}`,
          },
          credentials: "include",
        });

        return (await response.json()) as {
          status: string;
        };
      },
    }));

    const [isSlow, setIsSlow] = createSignal(false);
    const slowTimer = setTimeout(() => setIsSlow(true), slowSignInDelayMs);

    onCleanup(() => clearTimeout(slowTimer));

    return (
      <div class="space-y-4">
        <div>
          {isSlow() ? "Still processing" : "Processing"}
          {" "}
          your sign-in
          request...
        </div>
        <Show when={isSlow()}>
          <hr />
          <h2 class="h2">Debug Information</h2>
          <p>
            The sign in process is taking longer than expected.
            Here is some debug information:
          </p>
          <pre class="bg-gray-100 p-4 rounded-md overflow-x-scroll">
            <div>
              session_state:
              {session_state}
            </div>
            <div>
              iss:
              {iss}
            </div>
            <div>
              code:
              {code}
            </div>
            <div>
              state:
              {state}
            </div>
          </pre>
          <hr />
          <p>
            If you are not redirected, please click
            {" "}
            <a href="/login" class="link">
              here
            </a>
          </p>
        </Show>
        <Show when={authToken.error}>
          {error => (
            <div class="text-red-500 bg-red-100 p-4 rounded-md">
              <p>{error().message}</p>

              <a href="/login" class="button">
                Return to login
              </a>
            </div>
          )}
        </Show>
        <Show when={authToken.isSuccess}>
          <div>
            <h2 class="h2">Auth Token</h2>
            <pre class="bg-gray-100 p-4 rounded-md overflow-x-scroll">
              {JSON.stringify(authToken.data, undefined, 2)}
            </pre>
          </div>
        </Show>
        <Show when={me.isSuccess}>
          <div>
            <h2 class="h2">Me</h2>
            <pre class="bg-gray-100 p-4 rounded-md overflow-x-scroll">
              {JSON.stringify(me.data, undefined, 2)}
            </pre>
            <button onClick={() => logout.mutate()}>Logout</button>
          </div>
        </Show>
      </div>
    );
  },
});
