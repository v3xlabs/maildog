import { createLazyFileRoute } from '@tanstack/solid-router';

import { EmailList } from '@/components/EmailList';

export const Route = createLazyFileRoute('/_layout/m/$mail/')({
    component: () => {
        const parameters = Route.useParams();

        return (
            <div class="p-6">
                <EmailList configId={Number(parameters().mail)} />
            </div>
        );
    },
});
