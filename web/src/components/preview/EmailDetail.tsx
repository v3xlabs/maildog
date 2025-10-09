import { Link } from '@tanstack/react-router';

import { useEmail } from '../../api/emails';
import { EmailPreviewHeader } from './EmailHeader';

export const EmailDetail = ({
    configId,
    imapUid,
}: {
    configId: string;
    imapUid: string;
}) => {
    const { data, isLoading, error } = useEmail(
        Number(configId),
        Number(imapUid)
    );
    const email = data?.email;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div className="text-gray-600">Loading email...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-600 font-semibold mb-2">
                        Error loading email
                    </div>
                    <div className="text-red-700 text-sm">{error.message}</div>
                    <Link
                        to="/"
                        className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm"
                    >
                        ← Back to inbox
                    </Link>
                </div>
            </div>
        );
    }

    if (!email) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-gray-500 mb-4">Email not found</div>
                    <Link
                        to="/"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                        ← Back to inbox
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-5xl mx-auto p-6">
                <div className="mb-4">
                    <Link
                        to=".."
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                        <span>←</span> Back to inbox
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">
                            {email.subject || '(No Subject)'}
                        </h1>

                        <EmailPreviewHeader email={email} />

                        {email.has_attachments && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                                <span>📎</span>
                                <span>Has attachments</span>
                            </div>
                        )}
                    </div>

                    <div className="p-8">
                        <pre className="whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 p-4 rounded overflow-auto">
                            {email.raw_message}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};
