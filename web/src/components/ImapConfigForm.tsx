import { useState } from 'react';

import type { ImapConfigResponse } from '@/api/imapConfig';

import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { DialogClose } from '@radix-ui/react-dialog';
import { PasswordToggleField } from './ui/PasswordInput';

interface ImapConfigFormProperties {
    config?: ImapConfigResponse;
    onSubmit: (data: {
        name: string;
        mail_host: string;
        mail_port: number;
        username: string;
        password: string;
        use_tls: boolean;
        is_active: boolean;
    }) => void;
    onCancel?: () => void;
    onDelete?: () => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export const ImapConfigForm = ({
    config,
    onSubmit,
    onCancel,
    onDelete,
    isLoading,
    submitLabel = 'Save',
}: ImapConfigFormProperties) => {
    const [formData, setFormData] = useState({
        name: config?.name || '',
        mail_host: config?.mail_host || '',
        mail_port: config?.mail_port?.toString() || '993',
        username: config?.username || '',
        password: '',
        use_tls: config?.use_tls ?? true,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            mail_port: Number.parseInt(formData.mail_port, 10),
        });
    };

    const canDelete = onDelete;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                aria-label="Configuration Name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Email Account"
                required
                className="w-full border rounded px-3 py-2"
            />

            <Input
                aria-label="IMAP Server"
                type="text"
                value={formData.mail_host}
                onChange={(e) =>
                    setFormData({ ...formData, mail_host: e.target.value })
                }
                placeholder="imap.gmail.com"
                required
                className="w-full border rounded px-3 py-2"
            />

            <Input
                aria-label="Port"
                type="number"
                value={formData.mail_port}
                onChange={(e) =>
                    setFormData({ ...formData, mail_port: e.target.value })
                }
                placeholder="993"
                required
                className="w-full border rounded px-3 py-2"
            />

            <Input
                aria-label="Username/Email"
                type="text"
                value={formData.username}
                onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                }
                placeholder="you@example.com"
                required
                className="w-full border rounded px-3 py-2"
            />

            <PasswordToggleField
                aria-label={
                    config
                        ? 'Password (leave empty to keep current)'
                        : 'Password'
                }
                value={formData.password}
                onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                required={!config}
                className="w-full border rounded px-3 py-2"
            />

            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.use_tls}
                    onChange={(e) =>
                        setFormData({ ...formData, use_tls: e.target.checked })
                    }
                    className="w-4 h-4"
                />
                <span className="text-sm">Use TLS/SSL</span>
            </label>

            <div className="flex gap-2 justify-between">
                <div>
                    {canDelete && (
                        <Button type="button" variant="destructive" onClick={onDelete}>
                            Delete
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        variant="accent"
                        tone="blue"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
};
