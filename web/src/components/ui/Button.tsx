import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import clsx from 'clsx';
import { forwardRef } from 'react';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed',
    {
        variants: {
            variant: {
                primary:
                    'bg-surface-primary text-text-secondary hover:bg-surface-hover active:bg-surface-hover/80',
                secondary:
                    'bg-card border border-card-border text-text-primary hover:bg-surface-primary active:bg-surface-hover',
                accent: [
                    'bg-accent text-accent-foreground',
                    'hover:bg-accent/70 active:bg-accent-foreground',
                ].join(' '),
                outline:
                    'border border-card-border bg-transparent text-text-primary hover:bg-surface-primary hover:text-text-primary',
                ghost: 'text-text-primary hover:bg-surface-primary active:bg-surface-hover',
                destructive:
                    'border border-error/50 bg-error/10 hover:bg-error/30 active:bg-error/80',
                link: 'text-accent underline-offset-4 hover:underline',
                danger: 'bg-warning-background text-warning-text border border-warning-border hover:opacity-90 active:opacity-80',
            },
            size: {
                xs: 'h-7 px-2.5 text-xs',
                sm: 'h-8 px-3 text-sm',
                md: 'h-9 px-4 text-sm',
                lg: 'h-10 px-6 text-base',
                xl: 'h-11 px-8 text-base',
            },
            tone: {
                blue: null,
                green: null,
                purple: null,
                pink: null,
                orange: null,
                red: null,
                yellow: null,
                indigo: null,
            },
        },
        compoundVariants: [
            {
                variant: 'accent',
                tone: 'blue',
                class: 'bg-blue-600  hover:bg-blue-700  active:bg-blue-700  text-white focus-visible:ring-blue-400',
            },
            {
                variant: 'accent',
                tone: 'green',
                class: 'bg-green-600 hover:bg-green-700 active:bg-green-700 text-white focus-visible:ring-green-400',
            },
            {
                variant: 'accent',
                tone: 'purple',
                class: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-700 text-white focus-visible:ring-purple-400',
            },
            {
                variant: 'accent',
                tone: 'pink',
                class: 'bg-pink-600  hover:bg-pink-700  active:bg-pink-700  text-white focus-visible:ring-pink-400',
            },
            {
                variant: 'accent',
                tone: 'orange',
                class: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-700 text-white focus-visible:ring-orange-400',
            },
            {
                variant: 'accent',
                tone: 'red',
                class: 'bg-red-600   hover:bg-red-700   active:bg-red-700   text-white focus-visible:ring-red-400',
            },
            {
                variant: 'accent',
                tone: 'yellow',
                class: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-600 text-black focus-visible:ring-yellow-400',
            },
            {
                variant: 'accent',
                tone: 'indigo',
                class: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-700 text-white focus-visible:ring-indigo-400',
            },
        ],
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

export interface ButtonProperties
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProperties>(
    (
        {
            className,
            variant,
            size,
            tone,
            asChild = false,
            disabled,
            children,
            ...properties
        },
        reference
    ) => {
        const Comp = asChild ? Slot : 'button';

        return (
            <Comp
                className={clsx(
                    buttonVariants({ variant, size, tone }),
                    className
                )}
                ref={reference}
                disabled={disabled}
                {...properties}
            >
                {children}
            </Comp>
        );
    }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
