import { createLazyFileRoute } from '@tanstack/react-router';

import { usePageBySlug } from '@/api/pages';
import { type PageType, PageContent } from '@/components/PageContent';

export const Route = createLazyFileRoute('/p/$slug/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { slug } = Route.useParams();

    const userId = 'default-user';

    const { data: page, isLoading } = usePageBySlug(userId, slug);

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-500">Page not found</div>
            </div>
        );
    }

    return (
        <PageContent
            page={{ ...page, page_type: page.page_type as PageType }}
        />
    );
}
