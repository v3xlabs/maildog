import { ImapConfigResponse, useCreateImapConfig, useDeleteImapConfig, useUpdateImapConfig } from "@/api/imapConfig";
import { ImapConfigForm } from "@/components/ImapConfigForm";
import { Button } from "@/components/ui/Button";
import { DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { FC, useState } from "react";
import { LuPencil } from "react-icons/lu";

const EditImapConfigModal: FC<{ config: ImapConfigResponse }> = ({ config }) => {
    const [editingConfig, setEditingConfig] =
        useState<ImapConfigResponse>(config);
    const { mutate: updateConfig, isPending: updatePending } = useUpdateImapConfig();
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
                onSubmit={(data) => updateConfig({ id: config.id, data })}
                onCancel={() => setEditingConfig(config)}
                onDelete={() => deleteConfig(config.id)}
                isLoading={updatePending}
            />
        </div>
    )
};

export const EditImapConfigButton: FC<{ config: ImapConfigResponse }> = ({ config }) => {
    return (
        <DialogRoot>
            <DialogTrigger asChild>
                <Button variant="secondary" size="xs">
                    <LuPencil />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <EditImapConfigModal config={config} />
            </DialogContent>
        </DialogRoot>
    )
};