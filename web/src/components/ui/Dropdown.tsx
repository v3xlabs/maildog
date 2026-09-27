import { Content, Item } from '@kobalte/core/dropdown-menu';
import clsx from 'clsx';
import { ComponentProps, omit } from 'solid-js';

export const DropdownContent = (properties: ComponentProps<typeof Content>) => (
    <Content
        class={clsx(
            properties.class,
            'bg-card border border-card-border w-full rounded-sm'
        )}
        {...omit(properties, 'class')}
    />
);

export const DropdownItem = (properties: ComponentProps<typeof Item>) => (
    <Item
        class={clsx(
            'flex items-center gap-2 px-2 py-1.5 text-sm text-text-primary hover:bg-surface-primary cursor-pointer',
            properties.class
        )}
        {...omit(properties, 'class')}
    />
);

export {
    Portal as DropdownPortal,
    Root as DropdownRoot,
    Sub as DropdownSub,
    SubContent as DropdownSubContent,
    SubTrigger as DropdownSubTrigger,
    Trigger as DropdownTrigger,
} from '@kobalte/core/dropdown-menu';
