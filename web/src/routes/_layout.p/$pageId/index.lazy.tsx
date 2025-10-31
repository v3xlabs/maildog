import { createLazyFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { EmailList } from '@/components/EmailList';
import { usePage } from '@/api/pages';

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

    let config: { labelfilter?: string[] } = {};
    try {
        if (page.config) {
            config = JSON.parse(page.config);
        }
    } catch (e) {
        console.error('Failed to parse page config:', e);
    }

    return (
        <div className="p-6">
            <div className="mb-4">
                <h2 className="text-2xl font-bold">{page.name}</h2>
            </div>

            {page.page_type === 'email_list' && (
                <EmailList labels={config.labelfilter || []} />
            )}

            {page.page_type === 'calendar' && (
                <div className="text-gray-500">
                    Calendar view coming soon...
                </div>
            )}

            {page.page_type === 'overview' && (
                <div className="text-gray-500">
                    Overview page coming soon...
                </div>
            )}
        </div>
    );
}
