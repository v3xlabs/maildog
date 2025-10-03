import { createLazyFileRoute } from '@tanstack/react-router';
import { EmailDetail } from '@/components/EmailDetail';

export const Route = createLazyFileRoute('/mail/$config/$imap_uid')({
    component: () => {
        const { config, imap_uid } = Route.useParams();
        return <EmailDetail configId={config} imapUid={imap_uid} />;
    },
});
