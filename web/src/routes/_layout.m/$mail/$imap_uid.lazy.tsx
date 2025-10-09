import { createLazyFileRoute } from '@tanstack/react-router';

import { EmailDetail } from '@/components/preview/EmailDetail';

export const Route = createLazyFileRoute('/_layout/m/$mail/$imap_uid')({
    component: () => {
        const { mail, imap_uid } = Route.useParams();

        return <EmailDetail configId={mail} imapUid={imap_uid} />;
    },
});
