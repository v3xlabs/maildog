import { Link } from '@tanstack/solid-router';
import { formatDistanceToNow } from 'date-fns';
import { Errored, For, Loading, Show } from 'solid-js';

import { useEmails } from '@/api/emails';

export const EmailList = (props: { configId: number }) => {
    const emails = useEmails(() => props.configId);

    return (
        <Errored
            fallback={
                <div class="p-4 text-red-600">
                    Error loading emails: {emails.error?.message}
                </div>
            }
        >
            <Loading
                fallback={
                    <div class="p-4">
                        <div class="animate-pulse">Loading emails...</div>
                    </div>
                }
            >
                <div class="max-h-96 space-y-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold">Emails</h2>
                        <div class="text-sm text-gray-600">
                            Showing {emails.data?.emails.length} of{' '}
                            {emails.data?.total} emails
                        </div>
                    </div>

                    <div class="">
                        <For each={emails.data?.emails}>
                            {(email) => (
                                <Link
                                    to="/m/$mail/$imap_uid"
                                    params={{
                                        mail: String(props.configId),
                                        imap_uid: String(email.imap_uid),
                                    }}
                                    class="block px-4 py-1 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                                >
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <h3 class="font-semibold text-md">
                                                {email.subject || '(No Subject)'}
                                            </h3>
                                            <p class="text-sm text-gray-600">
                                                From:{' '}
                                                {email.from_address || 'Unknown'}
                                            </p>
                                        </div>
                                        <div class="text-sm text-gray-500">
                                            <Show when={email.created_at}>
                                                {(createdAt) => (
                                                    <div class="flex flex-col items-end">
                                                        <div>
                                                            {formatDistanceToNow(
                                                                new Date(createdAt())
                                                            )}{' '}
                                                            ago
                                                        </div>
                                                        <div>
                                                            {new Date(
                                                                createdAt()
                                                            ).toDateString()}
                                                        </div>
                                                    </div>
                                                )}
                                            </Show>
                                        </div>
                                    </div>
                                </Link>
                            )}
                        </For>
                    </div>

                    {/* Pagination info */}
                    <div class="text-center text-sm text-gray-600">
                        Page {emails.data?.page} • {emails.data?.page_size} per
                        page
                    </div>
                </div>
            </Loading>
        </Errored>
    );
};
