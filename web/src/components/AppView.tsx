import { useState } from 'react';
import { FiMail, FiPlus, FiEdit2, FiTrash2, FiCheck, FiSettings } from 'react-icons/fi';
import {
    useImapConfigs,
    useCreateImapConfig,
    useUpdateImapConfig,
    useDeleteImapConfig,
    useActivateImapConfig,
    type ImapConfigResponse,
} from '@/api/imapConfig';
import { ImapConfigForm } from './ImapConfigForm';
import { EmailList } from './EmailList';

export const AppView = () => {
    const { data, isLoading } = useImapConfigs();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingConfig, setEditingConfig] = useState<ImapConfigResponse | null>(null);
    
    const createConfig = useCreateImapConfig();
    const updateConfig = useUpdateImapConfig();
    const deleteConfig = useDeleteImapConfig();
    const activateConfig = useActivateImapConfig();

    const configs = data?.configs || [];
    const activeConfig = configs.find((c) => c.is_active);

    const handleCreate = (formData: any) => {
        createConfig.mutate(formData, {
            onSuccess: () => setShowAddForm(false),
        });
    };

    const handleUpdate = (formData: any) => {
        if (editingConfig) {
            updateConfig.mutate(
                { id: editingConfig.id, data: formData },
                {
                    onSuccess: () => setEditingConfig(null),
                }
            );
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this configuration?')) {
            deleteConfig.mutate(id);
        }
    };

    const handleActivate = (id: number) => {
        activateConfig.mutate(id);
    };

    if (showAddForm) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">Add Email Account</h2>
                    <ImapConfigForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowAddForm(false)}
                        isLoading={createConfig.isPending}
                    />
                </div>
            </div>
        );
    }

    if (editingConfig) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">Edit Email Account</h2>
                    <ImapConfigForm
                        config={editingConfig}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingConfig(null)}
                        isLoading={updateConfig.isPending}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <h1 className="text-xl font-bold">🐕 Maildog</h1>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <FiPlus />
                        Add Email Account
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-8">Loading...</div>
                    ) : configs.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <FiSettings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No email accounts yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {configs.map((config) => (
                                <div
                                    key={config.id}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        config.is_active
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {config.name}
                                                </h3>
                                                {config.is_active && (
                                                    <FiCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 truncate">
                                                {config.username}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {config.mail_host}:{config.mail_port}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-1 mt-2">
                                        {!config.is_active && (
                                            <button
                                                onClick={() => handleActivate(config.id)}
                                                className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                disabled={activateConfig.isPending}
                                            >
                                                Activate
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditingConfig(config)}
                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            <FiEdit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(config.id)}
                                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                            disabled={deleteConfig.isPending}
                                        >
                                            <FiTrash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
                    {activeConfig ? (
                        <p>Active: <span className="font-medium text-gray-700">{activeConfig.name}</span></p>
                    ) : (
                        <p>No active configuration</p>
                    )}
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Your Inbox</h2>
                            {activeConfig && (
                                <p className="text-gray-600">
                                    Viewing emails from {activeConfig.name}
                                </p>
                            )}
                        </div>
                        {activeConfig && <EmailList configId={activeConfig.id} />}
                    </div>
                </div>
            </main>
        </div>
    );
};
