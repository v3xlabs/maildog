import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { ImapConfigResponse } from '@/api/imapConfig';

interface ImapConfigFormProps {
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
    isLoading?: boolean;
    submitLabel?: string;
}

export const ImapConfigForm = ({
    config,
    onSubmit,
    onCancel,
    isLoading,
    submitLabel = 'Save',
}: ImapConfigFormProps) => {
    const [formData, setFormData] = useState({
        name: config?.name || '',
        mail_host: config?.mail_host || '',
        mail_port: config?.mail_port?.toString() || '993',
        username: config?.username || '',
        password: '',
        use_tls: config?.use_tls ?? true,
        is_active: config?.is_active ?? false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            mail_port: parseInt(formData.mail_port, 10),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                aria-label="Configuration Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Email Account"
                required
                className="w-full border rounded px-3 py-2"
            />

            <Input
                aria-label="IMAP Server"
                type="text"
                value={formData.mail_host}
                onChange={(e) => setFormData({ ...formData, mail_host: e.target.value })}
                placeholder="imap.gmail.com"
                required
                className="w-full border rounded px-3 py-2"
            />

            <Input
                aria-label="Port"
                type="number"
                value={formData.mail_port}
                onChange={(e) => setFormData({ ...formData, mail_port: e.target.value })}
                placeholder="993"
                required
                className="w-full border rounded px-3 py-2"
            />

            <Input
                aria-label="Username/Email"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full border rounded px-3 py-2"
            />

            <Input
                aria-label={config ? 'Password (leave empty to keep current)' : 'Password'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required={!config}
                className="w-full border rounded px-3 py-2"
            />

            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.use_tls}
                    onChange={(e) => setFormData({ ...formData, use_tls: e.target.checked })}
                    className="w-4 h-4"
                />
                <span className="text-sm">Use TLS/SSL</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                />
                <span className="text-sm">Set as active configuration</span>
            </label>

            <div className="flex gap-2 justify-end">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" variant="accent" tone="blue" disabled={isLoading}>
                    {isLoading ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </form>
    );
};
