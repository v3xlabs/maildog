import type { JSX } from "@solidjs/web";
import { createStore, Show, untrack } from "solid-js";

import type { ImapConfigResponse } from "@/api/imapConfig";

import { Button, buttonVariants } from "./ui/Button";
import { DialogClose } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { PasswordToggleField } from "./ui/PasswordInput";

type ImapConfigFormProperties = {
  config?: ImapConfigResponse;
  onSubmit: (data: {
    name: string;
    mail_host: string;
    mail_port: number;
    username: string;
    password: string;
    use_tls: boolean;
    is_active: boolean;
  }) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
};

export const ImapConfigForm = (properties: ImapConfigFormProperties) => {
  const [formData, setFormData] = createStore(
    untrack(() => ({
      name: properties.config?.name || "",
      mail_host: properties.config?.mail_host || "",
      mail_port: properties.config?.mail_port?.toString() || "993",
      username: properties.config?.username || "",
      password: "",
      use_tls: properties.config?.use_tls ?? true,
      is_active: true,
    })),
  );

  const setField = <Key extends keyof typeof formData>(
    key: Key,
    value: (typeof formData)[Key],
  ) =>
    setFormData((draft) => {
      draft[key] = value;
    });

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (
    event,
  ) => {
    event.preventDefault();
    properties.onSubmit({
      ...formData,
      mail_port: Number(formData.mail_port),
    });
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <Input
        aria-label="Configuration Name"
        type="text"
        value={formData.name}
        onInput={event =>
          setField("name", event.currentTarget.value)}
        placeholder="My Email Account"
        required
        class="w-full border rounded px-3 py-2"
      />

      <Input
        aria-label="IMAP Server"
        type="text"
        value={formData.mail_host}
        onInput={event =>
          setField("mail_host", event.currentTarget.value)}
        placeholder="imap.gmail.com"
        required
        class="w-full border rounded px-3 py-2"
      />

      <Input
        aria-label="Port"
        type="number"
        value={formData.mail_port}
        onInput={event =>
          setField("mail_port", event.currentTarget.value)}
        placeholder="993"
        required
        class="w-full border rounded px-3 py-2"
      />

      <Input
        aria-label="Username/Email"
        type="text"
        value={formData.username}
        onInput={event =>
          setField("username", event.currentTarget.value)}
        placeholder="you@example.com"
        required
        class="w-full border rounded px-3 py-2"
      />

      <PasswordToggleField
        label={
          properties.config
            ? "Password (leave empty to keep current)"
            : "Password"
        }
        value={formData.password}
        onChange={password =>
          setField("password", password)}
        placeholder="••••••••"
        required={!properties.config}
      />

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.use_tls}
          onInput={event =>
            setField("use_tls", event.currentTarget.checked)}
          class="w-4 h-4"
        />
        <span class="text-sm">Use TLS/SSL</span>
      </label>

      <div class="flex gap-2 justify-between">
        <div>
          <Show when={properties.onDelete}>
            <Button
              type="button"
              variant="destructive"
              onClick={() => properties.onDelete?.()}
            >
              Delete
            </Button>
          </Show>
        </div>
        <div class="flex gap-2">
          <DialogClose
            type="button"
            aria-label="Cancel"
            class={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </DialogClose>
          <Button
            type="submit"
            variant="accent"
            tone="blue"
            disabled={properties.isLoading}
          >
            {properties.isLoading ? "Saving..." : (properties.submitLabel ?? "Save")}
          </Button>
        </div>
      </div>
    </form>
  );
};
