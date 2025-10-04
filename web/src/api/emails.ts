import {
    infiniteQueryOptions,
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
    useInfiniteQuery,
} from '@tanstack/react-query';

import { useApi } from './api';
import { components } from './schema.gen';

export type EmailListItem = components['schemas']['EmailListItem'];
export type EmailResponse = components['schemas']['EmailResponse'];
export type EmailsListResponse = components['schemas']['EmailsListResponse'];
export type EmailDetailResponse = components['schemas']['EmailDetailResponse'];

export const getEmails = (imapConfigId: number, page: number = 1) =>
    queryOptions({
        queryKey: ['emails', imapConfigId, page],
        queryFn: async (): Promise<EmailsListResponse> => {
            const response = await useApi('/emails', 'get', {
                query: { imap_config_id: imapConfigId, page },
            });

            return response.data;
        },
    });

export const useEmails = (imapConfigId: number, page: number = 1) => useQuery(getEmails(imapConfigId, page));

export const getEmail = (imapConfigId: number, imapUid: number) =>
    queryOptions({
        queryKey: ['email', imapConfigId, imapUid],
        queryFn: async (): Promise<EmailDetailResponse> => {
            const response = await useApi('/emails/{imap_uid}', 'get', {
                path: { imap_uid: imapUid },
                query: { imap_config_id: imapConfigId },
            });

            return response.data;
        },
    });

export const useEmail = (imapConfigId: number, imapUid: number) => useQuery(getEmail(imapConfigId, imapUid));

export const getEmailsInfinite = (imapConfigId: number) =>
    infiniteQueryOptions({
        queryKey: ['emails', imapConfigId, 'infinite'],
        queryFn: async ({ pageParam }): Promise<EmailsListResponse> => {
            const response = await useApi('/emails', 'get', {
                query: { imap_config_id: imapConfigId, page: pageParam },
            });

            return response.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: EmailsListResponse, _allPages, lastPageParam) => {
            const totalPages = Math.ceil(lastPage.total / lastPage.page_size);
            
            return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
        },
    });

export const useEmailsInfinite = (imapConfigId: number) => useInfiniteQuery(getEmailsInfinite(imapConfigId));


