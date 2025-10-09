import { LuLink, LuMail, LuMailQuestion } from 'react-icons/lu';
import { match } from 'ts-pattern';

import { EmailResponse } from '@/api';
import { extractMail, parseListUnsubscribe } from '@/utils/mail/mail';

import { Button } from '../ui/Button';
import {
    DropdownContent,
    DropdownItem,
    DropdownPortal,
    DropdownRoot,
    DropdownTrigger,
} from '../ui/Dropdown';
import { ExternalLink } from '../ui/ExternalLink';

const extractName = (emailAddr: string | undefined) => {
    if (!emailAddr) return 'Unknown';

    const parts = emailAddr.split('<');

    if (parts.length > 1 && parts[0]) {
        return parts[0].trim();
    }

    return emailAddr;
};

const extractEmail = (email: string | undefined) => {
    if (!email) return;

    const match = email.match(/<(.+)>/);

    return match?.[1];
};

export const EmailPreviewHeader = ({ email }: { email: EmailResponse }) => {
    const senderEmail = extractEmail(email.from_address) || email.from_address;
    const toEmail = extractEmail(email.to_address) || email.to_address;

    const data = extractMail(email.raw_message || '');
    const hasUnsubscribe = data.headers['list-unsubscribe'];
    const unsubscribe = hasUnsubscribe
        ? parseListUnsubscribe(hasUnsubscribe)
        : null;

    return (
        <div className="space-y-3">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {email.from_address?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div
                        className="flex items-baseline gap-2 flex-wrap"
                        title={email.from_address}
                    >
                        {senderEmail}
                    </div>
                    {data.headers['sender'] && (
                        <div
                            className="text-sm text-gray-600 mt-1"
                            title={data.headers['sender']}
                        >
                            sent by {data.headers['sender']}
                        </div>
                    )}
                    {email.to_address && (
                        <div
                            className="text-sm text-gray-600 mt-1"
                            title={email.to_address}
                        >
                            to {toEmail}
                        </div>
                    )}
                    {data.headers['reply-to'] && (
                        <div
                            className="text-sm text-gray-600 mt-1"
                            title={data.headers['reply-to']}
                        >
                            reply-to {data.headers['reply-to']}
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-sm text-gray-500">
                        {email.date_sent &&
                            new Date(email.date_sent).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            })}
                    </div>
                    {hasUnsubscribe && (
                        <DropdownRoot>
                            <DropdownTrigger asChild>
                                <Button variant="outline">Unsubscribe</Button>
                            </DropdownTrigger>
                            <DropdownPortal>
                                <DropdownContent>
                                    {unsubscribe &&
                                        unsubscribe.map(
                                            (item) =>
                                                item && (
                                                    <div
                                                        key={item.raw}
                                                    >
                                                        {match(item.kind)
                                                            .with(
                                                                'mailto',
                                                                () => (
                                                                    <ExternalLink
                                                                        href={
                                                                            item.raw
                                                                        }
                                                                        className="flex items-center gap-1 px-4 py-1"
                                                                    >
                                                                        <LuMail />{' '}
                                                                        via mail
                                                                    </ExternalLink>
                                                                )
                                                            )
                                                            .with('url', () => (
                                                                <ExternalLink
                                                                    href={
                                                                        item.url ||
                                                                        ''
                                                                    }
                                                                    className="flex items-center gap-1 px-4 py-1"
                                                                >
                                                                    <LuLink />
                                                                    via url
                                                                </ExternalLink>
                                                            ))
                                                            .otherwise(() => (
                                                                <a
                                                                    href={
                                                                        item.raw
                                                                    }
                                                                    target="_blank"
                                                                    className="flex items-center gap-1 px-4 py-1"
                                                                >
                                                                    <LuMailQuestion />
                                                                    unknown
                                                                    option
                                                                </a>
                                                            ))}
                                                    </div>
                                                )
                                        )}
                                </DropdownContent>
                            </DropdownPortal>
                        </DropdownRoot>
                    )}
                </div>
            </div>
            <ul>
                {data.parts.map((part, index) => (
                    <li key={index}>
                        <div className="px-1 overflow-x-auto border">
                            {part.contentType}
                        </div>
                    </li>
                ))}
            </ul>
            <pre className="overflow-x-scroll border">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
};
