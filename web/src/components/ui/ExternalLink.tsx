// instead of being an a tag this link should be a button, that triggers a dialog, showing the entire url, domain, and path

import { DialogDescription } from '@radix-ui/react-dialog';
import { PropsWithChildren } from 'react';

import {
    DialogContent,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
} from './Dialog';

export type ExternalLinkProps = PropsWithChildren<{
    href: string;
    className?: string;
}>;

// or if it is a mailto link, show the email address
export const ExternalLink = ({
    href,
    children,
    className,
}: ExternalLinkProps) => {
    console.log('external link', href);

    return (
        <DialogRoot>
            <DialogTrigger asChild>
                <button className={className}>{children}</button>
            </DialogTrigger>
            <DialogContent aria-describedby="External link">
                <DialogTitle>You are about to leave this page</DialogTitle>
                <DialogDescription>Please confirm that the link below is safe to open, proceeding from here is at your own risk</DialogDescription>
                <pre className="whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 p-4 rounded overflow-auto border border-card-border">
                    <a href={href} target="_blank" className="link">{href}</a>
                </pre>
            </DialogContent>
        </DialogRoot>
    );
};
