import {
    useCreateImapConfig,
    useDeleteImapConfig,
    useImapConfigs,
    useUpdateImapConfig,
} from '@/api/imapConfig';

export const AppView = () => {
    const { data, isLoading } = useImapConfigs();

    type FormResponse = {
        name: string;
        mail_host: string;
        mail_port: number;
        username: string;
        password: string;
        use_tls: boolean;
        is_active: boolean;
    };

    const { mutate: createConfig, isPending: createPending } =
        useCreateImapConfig();
    const { mutate: updateConfig, isPending: updatePending } =
        useUpdateImapConfig();
    const { mutate: deleteConfig, isPending: deletePending } =
        useDeleteImapConfig();

    const configs = data?.configs || [];

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Your Inbox
                    </h2>
                </div>
            </div>
        </div>
    );
};
