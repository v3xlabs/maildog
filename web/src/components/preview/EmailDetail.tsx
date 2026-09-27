import { Link } from '@tanstack/solid-router';
import { Errored, Loading, Show } from 'solid-js';

import { useEmail } from '../../api/emails';
import { EmailPreviewHeader } from './EmailHeader';

export const EmailDetail = (props: { configId: string; imapUid: string }) => {
    const email = useEmail(
        () => Number(props.configId),
        () => Number(props.imapUid)
    );

    return (
        <Errored
            fallback={
                <div class="flex items-center justify-center h-full">
                    <div class="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
                        <div class="text-red-600 font-semibold mb-2">
                            Error loading email
                        </div>
                        <div class="text-red-700 text-sm">
                            {email.error?.message}
                        </div>
                        <Link
                            to="/"
                            class="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm"
                        >
                            ← Back to inbox
                        </Link>
                    </div>
                </div>
            }
        >
            <Loading
                fallback={
                    <div class="flex items-center justify-center h-full">
                        <div class="flex flex-col items-center gap-3">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <div class="text-gray-600">Loading email...</div>
                        </div>
                    </div>
                }
            >
                <Show
                    when={email.data?.email}
                    fallback={
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center">
                                <div class="text-gray-500 mb-4">
                                    Email not found
                                </div>
                                <Link
                                    to="/"
                                    class="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    ← Back to inbox
                                </Link>
                            </div>
                        </div>
                    }
                >
                    {(detail) => (
                        <div class="h-full overflow-auto">
                            <div class="max-w-5xl mx-auto p-6">
                                <div class="mb-4">
                                    <Link
                                        to=".."
                                        class="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                                    >
                                        <span>←</span> Back to inbox
                                    </Link>
                                </div>

                                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div class="p-8 border-b border-gray-200">
                                        <h1 class="text-2xl font-bold text-gray-900 mb-6">
                                            {detail().subject || '(No Subject)'}
                                        </h1>

                                        <EmailPreviewHeader email={detail()} />

                                        <Show when={detail().has_attachments}>
                                            <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                                                <span>📎</span>
                                                <span>Has attachments</span>
                                            </div>
                                        </Show>
                                    </div>

                                    <div class="p-8">
                                        <pre class="whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 p-4 rounded overflow-auto">
                                            {detail().raw_message}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Show>
            </Loading>
        </Errored>
    );
};
