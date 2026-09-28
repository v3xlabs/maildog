import { createLazyFileRoute, Link } from "@tanstack/solid-router";

import ChevronLeftIcon from "~icons/lucide/chevron-left";

import { Button, buttonVariants } from "../../components/ui/Button";

export const Route = createLazyFileRoute("/login/_layout/create")({
  component: () => (
    <>
      <h1 class="h2">Your Inbox Page</h1>
      <p>Welcome to the last inbox you'll ever need</p>
      <div class="flex flex-col gap-2">
        <Button>Create Account</Button>
      </div>
      <Link to="/login" class={buttonVariants({ variant: "ghost" })}>
        <ChevronLeftIcon />
        Back
      </Link>
    </>
  ),
});
