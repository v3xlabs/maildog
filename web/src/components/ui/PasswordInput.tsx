import { TextField } from "@kobalte/core/text-field";
import { ToggleButton } from "@kobalte/core/toggle-button";
import { createSignal, Show } from "solid-js";

import EyeIcon from "~icons/lucide/eye";
import EyeOffIcon from "~icons/lucide/eye-off";

type PasswordToggleFieldProperties = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

export const PasswordToggleField = (properties: PasswordToggleFieldProperties) => {
  const [isVisible, setIsVisible] = createSignal(false);

  return (
    <TextField
      class="flex flex-col gap-1"
      value={properties.value}
      onChange={properties.onChange}
      required={properties.required}
    >
      <TextField.Label class="text-sm text-text-secondary">
        {properties.label}
      </TextField.Label>
      <div class="flex flex-nowrap items-center justify-center rounded-[4px] text-black bg-white border gap-2 text-base font-sans">
        <TextField.Input
          type={isVisible() ? "text" : "password"}
          placeholder={properties.placeholder}
          class="text-inherit leading-[1] selection:bg-black selection:text-white w-full px-3 py-2"
        />
        <ToggleButton
          pressed={isVisible()}
          onChange={setIsVisible}
          aria-label="Show password"
          class="text-inherit leading-[1] flex items-center justify-center aspect-[1/1] rounded-[0.5px] focus-visible:outline-[2px] focus-visible:outline-accent-9 focus-visible:outline-offset-[2px] pr-3"
        >
          <Show when={isVisible()} fallback={<EyeOffIcon />}>
            <EyeIcon />
          </Show>
        </ToggleButton>
      </div>
    </TextField>
  );
};
