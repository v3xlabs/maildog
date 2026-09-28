import {
  Content,
  Description,
  Overlay,
  Portal,
  Title,
} from "@kobalte/core/dialog";
import clsx from "clsx";
import { ComponentProps, omit } from "solid-js";

export const DialogContent = (properties: ComponentProps<typeof Content>) => (
  <Portal>
    <DialogOverlay />
    <Content
      class={clsx(
        "fixed left-[50%] top-[50%] z-50 grid max-w-[90dvw] translate-x-[-50%] translate-y-[-50%] gap-4 border border-card-border bg-card p-6 shadow-lg duration-200 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[expanded]:slide-in-from-left-1/2 data-[expanded]:slide-in-from-top-[48%] rounded-lg",
        properties.class,
      )}
      {...omit(properties, "class")}
    />
  </Portal>
);

export const DialogOverlay = (properties: ComponentProps<typeof Overlay>) => (
  <Overlay
    class={clsx(
      "fixed inset-0 z-50 bg-black/30 p-2 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
      properties.class,
    )}
    {...omit(properties, "class")}
  />
);

export const DialogTitle = (properties: ComponentProps<typeof Title>) => (
  <Title
    class={clsx("text-2xl font-bold", properties.class)}
    {...omit(properties, "class")}
  />
);

export const DialogDescription = (
  properties: ComponentProps<typeof Description>,
) => (
  <Description
    class={clsx("text-sm text-gray-500", properties.class)}
    {...omit(properties, "class")}
  />
);

export {
  CloseButton as DialogClose,
  Root as DialogRoot,
  Trigger as DialogTrigger,
} from "@kobalte/core/dialog";
