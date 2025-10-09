import { createFileRoute, Link } from '@tanstack/react-router';

import { useInstanceConfig } from '../../../hooks/useInstanceConfig';

export const Route = createFileRoute(
    '/_layout/configure/_layout/instance/healthcheck'
)({
    component: () => {
        const { instance_url } = useInstanceConfig();

        return (
            <div className="space-y-4">
                <div>
                    Connecting to <span>{instance_url}</span>
                </div>
                <ul className="w-full">
                    {[
                        { label: 'Testing connectivity', status: 'z' },
                        { label: 'Testing something else', status: 'z' },
                    ].map(({ label, status }) => (
                        <li
                            key={label}
                            className="flex justify-between items-center w-full"
                        >
                            <span>{label}</span>
                            <span>{status}</span>
                        </li>
                    ))}
                </ul>
                <div className="w-full h-[1px] bg-border"></div>
                <div>
                    <Link to="/configure/instance">
                        Return to previous step
                    </Link>
                </div>
            </div>
        );
    },
});
