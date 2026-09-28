import { createLazyFileRoute } from "@tanstack/solid-router";

const RouteComponent = () => {
  const parameters = Route.useParams();

  return (
    <div class="p-4">
      <div class="card p-4">
        Mails by tag:
        {parameters().tag}
      </div>
    </div>
  );
};

export const Route = createLazyFileRoute("/_layout/t/$tag/")({
  component: RouteComponent,
});
