import { createLazyFileRoute } from '@tanstack/react-router';

import { usePage } from '@/api/pages';
import { type PageType, PageContent } from '@/components/PageContent';

export const Route = createLazyFileRoute('/_layout/p/$pageId/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { pageId } = Route.useParams();

    const { data: page, isLoading } = usePage(pageId);

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
