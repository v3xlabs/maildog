import { createLazyFileRoute } from '@tanstack/react-router';

import { EmailList } from '@/components/EmailList';

export const Route = createLazyFileRoute('/_layout/m/$mail/')({
    component: () => {
        const { mail } = Route.useParams();

        return (
            <div className="p-6">
                <EmailList configId={Number(mail)} />
            </div>
        );
    },
});
