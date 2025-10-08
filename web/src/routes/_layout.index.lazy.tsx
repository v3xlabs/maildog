import { createLazyFileRoute } from '@tanstack/react-router';

import { useImapConfigs } from '@/api/imapConfig';
import { AppView } from '@/components/AppView';
import { OnboardingFlow } from '@/components/OnboardingFlow';

const component = () => {
    const { data, isLoading } = useImapConfigs();

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600">Loading Maildog...</p>
                </div>
            </div>
        );
    }

    const hasConfigs = data?.configs && data.configs.length > 0;

    if (!hasConfigs) {
        return <OnboardingFlow />;
    }

    return <AppView />;
};

export const Route = createLazyFileRoute('/_layout/')({
    component,
});
