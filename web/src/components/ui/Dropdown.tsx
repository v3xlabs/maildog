import {
    Content,
    Item,
    SubTrigger,
    Trigger,
} from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';


export const DropdownTrigger = Trigger;

export const DropdownContent = forwardRef<
    ElementRef<typeof Content>,
    ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...properties }, reference) => (
    <Content
        ref={reference}
        className={clsx(
            className,
            'bg-card border border-card-border w-full rounded-sm'
        )}
        {...properties}
    >
        {children}
    </Content>
));

export const DropdownItem = forwardRef<
    ElementRef<typeof Item>,
    ComponentPropsWithoutRef<typeof Item>
>(({ className, children, ...properties }, reference) => (
    <Item
        ref={reference}
        className={clsx(
            'flex items-center gap-2 px-2 py-1.5 text-sm text-text-primary hover:bg-surface-primary cursor-pointer',
            className || ''
        )}
        {...properties}
    >
        {children}
    </Item>
));

export const DropdownSubTrigger = SubTrigger;

export {
    Portal as DropdownPortal,
    Root as DropdownRoot,
    Sub as DropdownSub,
    SubContent as DropdownSubContent,
} from '@radix-ui/react-dropdown-menu';
