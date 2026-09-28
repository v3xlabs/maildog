// instead of being an a tag this link should be a button, that triggers a dialog, showing the entire url, domain, and path

import { ParentProps } from "solid-js";

import {
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";

export type ExternalLinkProperties = ParentProps<{
  href: string;
  class?: string;
}>;

// or if it is a mailto link, show the email address
export const ExternalLink = (properties: ExternalLinkProperties) => (
  <DialogRoot>
    <DialogTrigger class={properties.class}>{properties.children}</DialogTrigger>
    <DialogContent>
      <DialogTitle>You are about to leave this page</DialogTitle>
      <DialogDescription>
        Please confirm that the link below is safe to open, proceeding
        from here is at your own risk
      </DialogDescription>
      <pre class="whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 p-4 rounded overflow-auto border border-card-border">
        <a href={properties.href} target="_blank" class="link">
          {properties.href}
        </a>
      </pre>
    </DialogContent>
  </DialogRoot>
);
