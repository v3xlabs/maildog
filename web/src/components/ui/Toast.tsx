import { Toast, toaster } from "@kobalte/core/toast";
import { Portal } from "@solidjs/web";
import clsx from "clsx";

import XIcon from "~icons/lucide/x";

type ToastKind = "success" | "error";

export const showToast = (kind: ToastKind, message: string) =>
  toaster.show(properties => (
    <Toast
      toastId={properties.toastId}
      class={clsx(
        "flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg",
        kind === "success"
        && "border-green-200 bg-green-50 text-green-800",
        kind === "error" && "border-red-200 bg-red-50 text-red-800",
      )}
    >
      <Toast.Title>{message}</Toast.Title>
      <Toast.CloseButton class="cursor-pointer" aria-label="Dismiss">
        <XIcon class="h-4 w-4" />
      </Toast.CloseButton>
    </Toast>
  ));

export const Toaster = () => (
  <Portal>
    <Toast.Region>
      <Toast.List class="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2" />
    </Toast.Region>
  </Portal>
);
