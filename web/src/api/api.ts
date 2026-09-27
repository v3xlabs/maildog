import { createFetch } from 'openapi-hooks';

import { showToast } from '@/components/ui/Toast';

import { paths } from './schema.gen';

export const baseUrl = new URL(
    '/api/',
    import.meta.env.VITE_API_URL ?? window.location.origin
);

export const useApi = createFetch<paths>({
    baseUrl,
    onError(error) {
        if (error.status === 429) {
            showToast(
                'error',
                'Request throttled, please wait a moment before retrying'
            );
        }
    },
});
