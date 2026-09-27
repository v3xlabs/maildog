import { createLazyFileRoute } from '@tanstack/solid-router';

import { EmailDetail } from '@/components/preview/EmailDetail';

export const Route = createLazyFileRoute('/_layout/m/$mail/$imap_uid')({
    component: () => {
        const parameters = Route.useParams();

        return (
            <EmailDetail
                configId={parameters().mail}
                imapUid={parameters().imap_uid}
            />
        );
    },
});
