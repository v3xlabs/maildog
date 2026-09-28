import { useCreateImapConfig } from "@/api/imapConfig";
import { ImapConfigForm } from "@/components/ImapConfigForm";
import { buttonVariants } from "@/components/ui/Button";
import {
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import PlusIcon from "~icons/lucide/plus";

const AddImapConfigModal = () => {
  const createConfig = useCreateImapConfig();

  return (
    <div class="max-w-md w-screen">
      <DialogTitle>Edit Email Account</DialogTitle>
      <DialogDescription>
        Edit the email account configuration.
      </DialogDescription>
      <ImapConfigForm
        onSubmit={data => createConfig.mutate(data)}
        isLoading={createConfig.isPending}
      />
    </div>
  );
};

export const AddImapConfigButton = () => (
  <DialogRoot>
    <DialogTrigger class={buttonVariants({ variant: "secondary", size: "xs" })}>
      <PlusIcon />
      {" "}
      Add
    </DialogTrigger>
    <DialogContent>
      <AddImapConfigModal />
    </DialogContent>
  </DialogRoot>
);
