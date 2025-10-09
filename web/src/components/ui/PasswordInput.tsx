import { ComponentPropsWithoutRef, ElementRef, forwardRef, InputHTMLAttributes } from "react";
import { Root, Input, Toggle, Icon } from '@radix-ui/react-password-toggle-field';
import { LuEye, LuEyeOff } from "react-icons/lu";

export const PasswordToggleField = forwardRef<ElementRef<typeof Input>, ComponentPropsWithoutRef<typeof Input>>(({ ...properties }, reference) => (
    <label
        className="flex flex-col gap-1"
        id={'l' + properties.id}
        htmlFor={'i' + properties.id}
    >
        <span className="text-sm text-text-secondary">
            {properties["aria-label"]}
        </span>
        <Root>
            <div className="flex flex-nowrap items-center justify-center rounded-[4px] text-black bg-white border gap-2 text-base font-sans">
                <Input {...properties} ref={reference} className="text-inherit leading-[1] selection:bg-black selection:text-white w-full px-3 py-2" />
                <Toggle className="text-inherit leading-[1] flex items-center justify-center aspect-[1/1] rounded-[0.5px] focus-visible:outline-[2px] focus-visible:outline-accent-9 focus-visible:outline-offset-[2px] pr-3">
                    <Icon
                        visible={<LuEye />}
                        hidden={<LuEyeOff />}
                    />
                </Toggle>
            </div>
        </Root>
    </label>
));
