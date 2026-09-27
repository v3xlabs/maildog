import PencilIcon from '~icons/lucide/pencil';

import {
    ImapConfigResponse,
    useDeleteImapConfig,
    useUpdateImapConfig,
} from '@/api/imapConfig';
import { ImapConfigForm } from '@/components/ImapConfigForm';
import { buttonVariants } from '@/components/ui/Button';
import {
    DialogContent,
    DialogDescription,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog';

const EditImapConfigModal = (props: { config: ImapConfigResponse }) => {
    const updateConfig = useUpdateImapConfig();
    const deleteConfig = useDeleteImapConfig();

    return (
        <div class="max-w-md w-screen">
            <DialogTitle>Edit Email Account</DialogTitle>
            <DialogDescription>
                Edit the email account configuration.
            </DialogDescription>
            <ImapConfigForm
                config={props.config}
                onSubmit={(data) =>
                    updateConfig.mutate({ id: props.config.id, data })
                }
                onDelete={() => deleteConfig.mutate(props.config.id)}
                isLoading={updateConfig.isPending}
            />
        </div>
    );
};

export const EditImapConfigButton = (props: { config: ImapConfigResponse }) => (
    <DialogRoot>
        <DialogTrigger class={buttonVariants({ variant: 'secondary', size: 'xs' })}>
            <PencilIcon />
        </DialogTrigger>
        <DialogContent>
            <EditImapConfigModal config={props.config} />
        </DialogContent>
    </DialogRoot>
);
