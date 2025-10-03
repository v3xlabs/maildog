import { createFetch } from 'openapi-hooks';
import { toast } from 'sonner';

import { paths } from './schema.gen';

export const baseUrl = new URL('/api/', import.meta.env.VITE_API_URL ?? window.location.origin);

// @ts-expect-error - openapi-hooks type constraint is too strict
export const useApi = createFetch<paths>({
    baseUrl,
    onError(error: { status: number }) {
        if (error.status === 429) {
            toast.error('Request throttled, please wait a moment before retrying');
        }
    },
});
