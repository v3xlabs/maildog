import { ImapConfigResponse, useCreateImapConfig, useDeleteImapConfig, useUpdateImapConfig } from "@/api/imapConfig";
import { ImapConfigForm } from "@/components/ImapConfigForm";
import { Button } from "@/components/ui/Button";
import { DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { FC, useState } from "react";
import { LuPlus } from "react-icons/lu";

const AddImapConfigModal: FC = () => {
    const [editingConfig, setEditingConfig] =
        useState<ImapConfigResponse>();
    const { mutate: createConfig, isPending: createPending } = useCreateImapConfig();
    const { mutate: deleteConfig, isPending: deletePending } = useDeleteImapConfig();

    return (
        <div className="max-w-md w-screen">
            <DialogTitle>
                Edit Email Account
            </DialogTitle>
            <DialogDescription>
                Edit the email account configuration.
            </DialogDescription>
            <ImapConfigForm
                config={editingConfig}
                onSubmit={(data) => createConfig(data)}
                isLoading={createPending}
            />
        </div>
    )
};

export const AddImapConfigButton: FC = () => {
    return (
        <DialogRoot>
            <DialogTrigger asChild>
                <Button variant="secondary" size="xs">
                    <LuPlus /> Add
                </Button>
            </DialogTrigger>
            <DialogContent>
                <AddImapConfigModal />
            </DialogContent>
        </DialogRoot>
    )
};