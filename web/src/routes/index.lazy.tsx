import { createLazyFileRoute } from '@tanstack/react-router';

import { Button } from '../components/ui/Button';
import { EmailList } from '@/components/EmailListExample';

const component = () => {
    return (
        <div className="p-2 w-full h-full flex items-center justify-center">
            <div className="border p-4 rounded-lg space-y-2 w-full max-w-lg">
                <h1 className="h2">Your Inbox Page</h1>
                <EmailList />
                <div>
                    Being developed by{' '}
                    <a
                        href="https://v3x.company"
                        className="link"
                        target="_blank"
                    >
                        V3X Labs
                    </a>
                </div>
            </div>
        </div>
    );
};

export const Route = createLazyFileRoute('/')({
    component,
});
