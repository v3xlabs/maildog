import {
    infiniteQueryOptions,
    queryOptions,
    useInfiniteQuery,
    useQuery,
} from '@tanstack/solid-query';
import { Accessor } from 'solid-js';

import { useApi } from './api';
import { components } from './schema.gen';

export type EmailListItem = components['schemas']['EmailListItem'];
export type EmailResponse = components['schemas']['EmailResponse'];
export type EmailsListResponse = components['schemas']['EmailsListResponse'];
export type EmailDetailResponse = components['schemas']['EmailDetailResponse'];

const fetchEmails = async (
    imapConfigId: number,
    page: number
): Promise<EmailsListResponse> => {
    const response = await useApi('/emails', 'get', {
        query: { imap_config_id: imapConfigId, page },
    });

    if (response.status === 200) return response.data;

    throw new Error(`Could not load emails (${response.status})`);
};

export const getEmails = (imapConfigId: number, page: number = 1) =>
    queryOptions({
        queryKey: ['emails', imapConfigId, page],
        queryFn: () => fetchEmails(imapConfigId, page),
    });

export const useEmails = (imapConfigId: Accessor<number>) =>
    useQuery(() => getEmails(imapConfigId()));

export const getEmail = (imapConfigId: number, imapUid: number) =>
    queryOptions({
        queryKey: ['email', imapConfigId, imapUid],
        queryFn: async (): Promise<EmailDetailResponse> => {
            const response = await useApi('/emails/{imap_uid}', 'get', {
                path: { imap_uid: imapUid },
                query: { imap_config_id: imapConfigId },
            });

            if (response.status === 200) return response.data;

            throw new Error(`Could not load email (${response.status})`);
        },
    });

export const useEmail = (
    imapConfigId: Accessor<number>,
    imapUid: Accessor<number>
) => useQuery(() => getEmail(imapConfigId(), imapUid()));

export const getEmailsInfinite = (labels?: string[], imapConfigId?: number) =>
    infiniteQueryOptions({
        queryKey: ['emails', imapConfigId, 'infinite'],
        queryFn: ({ pageParam }) => fetchEmails(imapConfigId, pageParam),
        initialPageParam: 1,
        getNextPageParam: (
            lastPage: EmailsListResponse,
            _allPages,
            lastPageParameter
        ) => {
            const totalPages = Math.ceil(lastPage.total / lastPage.page_size);

            return lastPageParameter < totalPages
                ? lastPageParameter + 1
                : undefined;
        },
    });

export const useEmailsInfinite = (imapConfigId: Accessor<number>) =>
    useInfiniteQuery(() => getEmailsInfinite(imapConfigId()));
