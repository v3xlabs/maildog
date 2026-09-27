import LinkIcon from '~icons/lucide/link';
import MailIcon from '~icons/lucide/mail';
import MailQuestionIcon from '~icons/lucide/mail-question';
import { createMemo, For, Show } from 'solid-js';
import { match } from 'ts-pattern';

import { EmailResponse } from '@/api';
import { extractMail, parseListUnsubscribe } from '@/utils/mail/mail';

import { buttonVariants } from '../ui/Button';
import {
    DropdownContent,
    DropdownPortal,
    DropdownRoot,
    DropdownTrigger,
} from '../ui/Dropdown';
import { ExternalLink } from '../ui/ExternalLink';

const extractEmail = (email: string | undefined) => {
    if (!email) return;

    const match = email.match(/<(.+)>/);

    return match?.[1];
};

export const EmailPreviewHeader = (props: { email: EmailResponse }) => {
    const senderEmail = () =>
        extractEmail(props.email.from_address) || props.email.from_address;
    const toEmail = () =>
        extractEmail(props.email.to_address) || props.email.to_address;

    const data = createMemo(() => extractMail(props.email.raw_message || ''));
    const unsubscribeHeader = () => data().headers['list-unsubscribe'];
    const unsubscribe = createMemo(() => {
        const header = unsubscribeHeader();

        return header ? parseListUnsubscribe(header) : [];
    });

    return (
        <div class="space-y-3">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {props.email.from_address?.charAt(0).toUpperCase() || '?'}
                </div>
                <div class="flex-1 min-w-0">
                    <div
                        class="flex items-baseline gap-2 flex-wrap"
                        title={props.email.from_address}
                    >
                        {senderEmail()}
                    </div>
                    <Show when={data().headers['sender']}>
                        {(sender) => (
                            <div class="text-sm text-gray-600 mt-1" title={sender()}>
                                sent by {sender()}
                            </div>
                        )}
                    </Show>
                    <Show when={props.email.to_address}>
                        {(toAddress) => (
                            <div
                                class="text-sm text-gray-600 mt-1"
                                title={toAddress()}
                            >
                                to {toEmail()}
                            </div>
                        )}
                    </Show>
                    <Show when={data().headers['reply-to']}>
                        {(replyTo) => (
                            <div class="text-sm text-gray-600 mt-1" title={replyTo()}>
                                reply-to {replyTo()}
                            </div>
                        )}
                    </Show>
                </div>
                <div class="flex flex-col items-end">
                    <div class="text-sm text-gray-500">
                        <Show when={props.email.date_sent}>
                            {(dateSent) =>
                                new Date(dateSent()).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })
                            }
                        </Show>
                    </div>
                    <Show when={unsubscribeHeader()}>
                        <DropdownRoot>
                            <DropdownTrigger
                                class={buttonVariants({ variant: 'outline' })}
                            >
                                Unsubscribe
                            </DropdownTrigger>
                            <DropdownPortal>
                                <DropdownContent>
                                    <For each={unsubscribe()}>
                                        {(item) => (
                                            <Show when={item}>
                                                {(entry) => (
                                                    <div>
                                                        {match(entry().kind)
                                                            .with('mailto', () => (
                                                                <ExternalLink
                                                                    href={entry().raw}
                                                                    class="flex items-center gap-1 px-4 py-1"
                                                                >
                                                                    <MailIcon /> via
                                                                    mail
                                                                </ExternalLink>
                                                            ))
                                                            .with('url', () => (
                                                                <ExternalLink
                                                                    href={entry().url || ''}
                                                                    class="flex items-center gap-1 px-4 py-1"
                                                                >
                                                                    <LinkIcon />
                                                                    via url
                                                                </ExternalLink>
                                                            ))
                                                            .otherwise(() => (
                                                                <a
                                                                    href={entry().raw}
                                                                    target="_blank"
                                                                    class="flex items-center gap-1 px-4 py-1"
                                                                >
                                                                    <MailQuestionIcon />
                                                                    unknown option
                                                                </a>
                                                            ))}
                                                    </div>
                                                )}
                                            </Show>
                                        )}
                                    </For>
                                </DropdownContent>
                            </DropdownPortal>
                        </DropdownRoot>
                    </Show>
                </div>
            </div>
            <ul>
                <For each={data().parts}>
                    {(part) => (
                        <li>
                            <div class="px-1 overflow-x-auto border">
                                {part.contentType}
                            </div>
                        </li>
                    )}
                </For>
            </ul>
            <pre class="overflow-x-scroll border">
                {JSON.stringify(data(), null, 2)}
            </pre>
        </div>
    );
};
