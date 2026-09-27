import ArrowRightIcon from '~icons/lucide/arrow-right';
import MailIcon from '~icons/lucide/mail';
import { createSignal, Show } from 'solid-js';

import { useCreateImapConfig } from '@/api/imapConfig';

import { ImapConfigForm } from './ImapConfigForm';

export const OnboardingFlow = () => {
    const [step, setStep] = createSignal<'welcome' | 'configure'>('welcome');
    const createConfig = useCreateImapConfig();

    return (
        <Show
            when={step() === 'configure'}
            fallback={
                <div class="min-h-screen flex items-center justify-center p-4">
                    <div class="max-w-md w-full bg-white rounded-2xl p-8 space-y-6">
                        <div class="text-center space-y-4">
                            <div class="flex justify-center">
                                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <MailIcon class="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <h1 class="text-3xl font-bold text-gray-900">
                                Welcome to Maildog!
                            </h1>
                            <p class="text-gray-600">
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit.
                            </p>
                        </div>

                        <button
                            onClick={() => setStep('configure')}
                            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 group"
                        >
                            Get Started
                            <ArrowRightIcon class="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            }
        >
            <div class="min-h-screen flex items-center justify-center p-4">
                <div class="max-w-md w-full bg-white rounded-2xl p-8 space-y-6">
                    <div class="text-center space-y-2">
                        <h2 class="text-2xl font-bold text-gray-900">
                            Configure Your Email
                        </h2>
                        <p class="text-gray-600">
                            Enter your IMAP server details below
                        </p>
                    </div>

                    <ImapConfigForm
                        onSubmit={(data) => createConfig.mutate(data)}
                        isLoading={createConfig.isPending}
                        submitLabel="Connect Email"
                    />

                    <div class="text-center">
                        <button
                            onClick={() => setStep('welcome')}
                            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};
