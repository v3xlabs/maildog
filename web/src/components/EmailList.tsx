import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';

import { useEmails } from '@/api/emails';

export function EmailList({ configId }: { configId: number }) {
    const { data, isLoading, error } = useEmails(configId);

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse">Loading emails...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-600">
                Error loading emails: {error.message}
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="max-h-96 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Emails</h2>
                <div className="text-sm text-gray-600">
                    Showing {data.emails.length} of {data.total} emails
                </div>
            </div>

            <div className="">
                {data.emails.map((email) => (
                    <Link
                        key={email.imap_uid}
                        to="/m/$mail/$imap_uid"
                        params={{
                            mail: String(configId),
                            imap_uid: String(email.imap_uid),
                        }}
                        className="block px-4 py-1 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="font-semibold text-md">
                                    {email.subject || '(No Subject)'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    From: {email.from_address || 'Unknown'}
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">
                                {email.created_at && (
                                    <div className="flex flex-col items-end">
                                        <div>
                                            {formatDistanceToNow(new Date(email.created_at))} ago
                                        </div>
                                        <div>
                                            {new Date(
                                                email.created_at
                                            ).toDateString()}
                                        </div>
                                    </div>

                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination info */}
            <div className="text-center text-sm text-gray-600">
                Page {data.page} • {data.page_size} per page
            </div>
        </div>
    );
}
