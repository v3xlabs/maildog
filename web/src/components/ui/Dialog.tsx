import { Content, Description, DialogPortal, Overlay, Title } from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

export const DialogContent = forwardRef<
    ElementRef<typeof Content>,
    ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...properties }, reference) => (
    <DialogPortal>
        <DialogOverlay />
        <Content
            ref={reference}
            className={clsx(
                'fixed left-[50%] top-[50%] z-50 grid max-w-[90dvw] translate-x-[-50%] translate-y-[-50%] gap-4 border border-card-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg',
                className
            )}
            {...properties}
        >
            {children}
        </Content>
    </DialogPortal>
));

export const DialogOverlay = forwardRef<
    ElementRef<typeof Overlay>,
    ComponentPropsWithoutRef<typeof Overlay>
>(({ className, ...properties }, reference) => (
    <Overlay
        ref={reference}
        className={clsx(
            'fixed inset-0 z-50 bg-black/30 p-2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className
        )}
        {...properties}
    />
));

export const DialogTitle = forwardRef<
    ElementRef<typeof Title>,
    ComponentPropsWithoutRef<typeof Title>
>(({ className, ...properties }, reference) => (
    <Title ref={reference} className={clsx('text-2xl font-bold', className)} {...properties} />
));

export const DialogDescription = forwardRef<
    ElementRef<typeof Description>,
    ComponentPropsWithoutRef<typeof Description>
>(({ className, ...properties }, reference) => (
    <Description ref={reference} className={clsx('text-sm text-gray-500', className)} {...properties} />
));

export {
    Root as DialogRoot,
    Trigger as DialogTrigger,
} from '@radix-ui/react-dialog';
