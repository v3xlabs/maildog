import { useState } from 'react';
import { FiArrowRight, FiMail } from 'react-icons/fi';

import { useCreateImapConfig } from '@/api/imapConfig';

import { ImapConfigForm } from './ImapConfigForm';

export const OnboardingFlow = () => {
    const [step, setStep] = useState<'welcome' | 'configure'>('welcome');
    const createConfig = useCreateImapConfig();

    const handleSubmit = (data: {
        name: string;
        mail_host: string;
        mail_port: number;
        username: string;
        password: string;
        use_tls: boolean;
        is_active: boolean;
    }) => {
        createConfig.mutate({ ...data });
    };

    if (step === 'welcome') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl p-8 space-y-6">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <FiMail className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome to Maildog!
                        </h1>
                        <p className="text-gray-600">
                            Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit.
                        </p>
                    </div>

                    <button
                        onClick={() => setStep('configure')}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 group"
                    >
                        Get Started
                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Configure Your Email
                    </h2>
                    <p className="text-gray-600">
                        Enter your IMAP server details below
                    </p>
                </div>

                <ImapConfigForm
                    onSubmit={handleSubmit}
                    isLoading={createConfig.isPending}
                    submitLabel="Connect Email"
                />

                <div className="text-center">
                    <button
                        onClick={() => setStep('welcome')}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← Back
                    </button>
                </div>
            </div>
        </div>
    );
};
