import { useEmails } from '@/api/emails';
import { Link } from '@tanstack/react-router';

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

            <div className="space-y-2">
                {data.emails.map((email) => (
                    <Link
                        key={email.imap_uid}
                        to="/mail/$config/$imap_uid"
                        params={{ config: String(configId), imap_uid: String(email.imap_uid) }}
                        className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors hover:shadow-md"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                    {email.subject || '(No Subject)'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    From: {email.from_address || 'Unknown'}
                                </p>
                                {email.to_address && (
                                    <p className="text-sm text-gray-600">
                                        To: {email.to_address}
                                    </p>
                                )}
                            </div>
                            <div className="text-sm text-gray-500">
                                {email.created_at && (
                                    <span>
                                        {new Date(email.created_at).toLocaleDateString()}
                                    </span>
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
