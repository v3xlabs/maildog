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

export const getEmails = (page: number = 1) =>
    queryOptions({
        queryKey: ['emails', page],
        queryFn: async (): Promise<EmailsListResponse> => {
            const response = await useApi('/emails', 'get', {
                query: { page },
            });

            return response.data;
        },
    });

export const useEmails = (page: number = 1) => useQuery(getEmails(page));

export const getEmail = (imapUid: number) =>
    queryOptions({
        queryKey: ['email', imapUid],
        queryFn: async (): Promise<EmailDetailResponse> => {
            const response = await useApi('/emails/{imap_uid}', 'get', {
                path: { imap_uid: imapUid },
            });

            return response.data;
        },
    });

export const useEmail = (imapUid: number) => useQuery(getEmail(imapUid));

export const getEmailsInfinite = () =>
    infiniteQueryOptions({
        queryKey: ['emails', 'infinite'],
        queryFn: async ({ pageParam }): Promise<EmailsListResponse> => {
            const response = await useApi('/emails', 'get', {
                query: { page: pageParam },
            });

            return response.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: EmailsListResponse, _allPages, lastPageParam) => {
            const totalPages = Math.ceil(lastPage.total / lastPage.page_size);
            
            return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
        },
    });

export const useEmailsInfinite = () => useInfiniteQuery(getEmailsInfinite());


