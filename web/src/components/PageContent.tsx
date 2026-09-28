import { EmailList } from '@/components/EmailList';

export const PAGE_TYPES = ['email_list', 'calendar', 'overview'] as const;
export type PageType = (typeof PAGE_TYPES)[number];

type PageContentProperties = {
    page: {
        name: string;
        page_type: PageType;
        config: string;
    };
};

type PageConfig = {
    labelfilter?: string[];
};

export function PageContent({ page }: PageContentProperties) {
    const config = (() => {
        try {
            return JSON.parse(page.config) as PageConfig;
        } catch {
            return {};
        }
    })();

    return (
        <div className="p-6">
            <div className="mb-4">
                <h2 className="text-2xl font-bold">{page.name}</h2>
            </div>
            {page.page_type === 'email_list' && (
                <EmailList labels={config.labelfilter} />
            )}
            {page.page_type === 'calendar' && (
                <EmailList
                    labels={config.labelfilter ?? ['calendar-invites']}
                />
            )}
            {page.page_type === 'overview' && (
                <EmailList labels={config.labelfilter} />
            )}
        </div>
    );
}
