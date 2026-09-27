import { ParsedLocation, redirect } from '@tanstack/solid-router';
import { createSignal } from 'solid-js';

// Key and shape match the earlier zustand `persist` storage, so saved values survive.
const storageKey = 'instance-config';

const readStoredInstanceUrl = (): string => {
    const stored = localStorage.getItem(storageKey);

    if (!stored) return '';

    try {
        const parsed: unknown = JSON.parse(stored);

        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'state' in parsed &&
            typeof parsed.state === 'object' &&
            parsed.state !== null &&
            'instance_url' in parsed.state &&
            typeof parsed.state.instance_url === 'string'
        ) {
            return parsed.state.instance_url;
        }
    } catch {
        // Corrupt storage is treated as no saved instance.
    }

    return '';
};

const [instanceUrl, setStoredInstanceUrl] = createSignal(readStoredInstanceUrl());

export const setInstanceUrl = (url: string) => {
    setStoredInstanceUrl(url);
    localStorage.setItem(
        storageKey,
        JSON.stringify({ state: { instance_url: url }, version: 0 })
    );
};

const environmentInstanceUrl = import.meta.env.VITE_INSTANCE_URL;

if (environmentInstanceUrl && environmentInstanceUrl !== instanceUrl()) {
    setInstanceUrl(environmentInstanceUrl);
}

export { instanceUrl };

export const requireInstanceUrl = ({ location }: { location: ParsedLocation }) => {
    if (instanceUrl()) return;

    throw redirect({
        to: '/configure/instance',
        search: { to: location.href },
    });
};
