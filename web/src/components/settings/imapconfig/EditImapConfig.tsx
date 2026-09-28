import {
  ImapConfigResponse,
  useDeleteImapConfig,
  useUpdateImapConfig,
} from "@/api/imapConfig";
import { ImapConfigForm } from "@/components/ImapConfigForm";
import { buttonVariants } from "@/components/ui/Button";
import {
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import PencilIcon from "~icons/lucide/pencil";

const EditImapConfigModal = (properties: { config: ImapConfigResponse; }) => {
  const updateConfig = useUpdateImapConfig();
  const deleteConfig = useDeleteImapConfig();

  return (
    <div class="max-w-md w-screen">
      <DialogTitle>Edit Email Account</DialogTitle>
      <DialogDescription>
        Edit the email account configuration.
      </DialogDescription>
      <ImapConfigForm
        config={properties.config}
        onSubmit={data =>
          updateConfig.mutate({
            imap_config_id: properties.config["id"],
            data,
          })}
        onDelete={() => deleteConfig.mutate(properties.config["id"])}
        isLoading={updateConfig.isPending}
      />
    </div>
  );
};

export const EditImapConfigButton = (properties: { config: ImapConfigResponse; }) => (
  <DialogRoot>
    <DialogTrigger class={buttonVariants({ variant: "secondary", size: "xs" })}>
      <PencilIcon />
    </DialogTrigger>
    <DialogContent>
      <EditImapConfigModal config={properties.config} />
    </DialogContent>
  </DialogRoot>
);
