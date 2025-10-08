import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_layout/t/$tag/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { tag } = Route.useParams();

    return (
        <div className="p-4">
            <div className="card p-4">Mails by tag: {tag}</div>
        </div>
    );
}
