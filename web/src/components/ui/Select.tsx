'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { cx } from 'class-variance-authority';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
    ElementRef<typeof SelectPrimitive.Trigger>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...properties }, reference) => (
    <SelectPrimitive.Trigger
        ref={reference}
        className={cx(
            'border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
        )}
        {...properties}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <FiChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = forwardRef<
    ElementRef<typeof SelectPrimitive.Content>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...properties }, reference) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={reference}
            className={cx(
                'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-black animate-in fade-in-80',
                position === 'popper' &&
                    'translate-y-1 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                className
            )}
            position={position}
            {...properties}
        >
            <SelectPrimitive.Viewport
                className={cx(
                    'p-1',
                    position === 'popper' &&
                        'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
                )}
            >
                {children}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = forwardRef<
    ElementRef<typeof SelectPrimitive.Label>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...properties }, reference) => (
    <SelectPrimitive.Label
        ref={reference}
        className={cx('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
        {...properties}
    />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = forwardRef<
    ElementRef<typeof SelectPrimitive.Item>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...properties }, reference) => (
    <SelectPrimitive.Item
        ref={reference}
        className={cx(
            'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className
        )}
        {...properties}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <FiCheck className="h-4 w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>

        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = forwardRef<
    ElementRef<typeof SelectPrimitive.Separator>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...properties }, reference) => (
    <SelectPrimitive.Separator
        ref={reference}
        className={cx('-mx-1 my-1 h-px bg-neutral-100', className)}
        {...properties}
    />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
