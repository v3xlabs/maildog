import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { useApi } from './api';
import { components } from './schema.gen';

export type PageResponse = components['schemas']['PageResponse'];
export type PageListResponse = components['schemas']['PageListResponse'];
export type PageMessageResponse = components['schemas']['PageMessageResponse'];

export const getPage = (pageSlug: string) =>
    queryOptions({
        queryKey: ['pages', 'detail', pageSlug],
        queryFn: async (): Promise<PageResponse> => {
            const response = await useApi('/pages/detail/{slug}', 'get', {
                path: { slug: pageSlug },
            });

            return response.data;
        },
    });

export const usePage = (pageId: string) => useQuery(getPage(pageId));

export const getPageBySlug = (userId: string, slug: string) =>
    queryOptions({
        queryKey: ['pages', 'slug', userId, slug],
        queryFn: async (): Promise<PageResponse> => {
            const response = await useApi('/pages/detail/{slug}', 'get', {
                path: { slug },
            });

            return response.data;
        },
    });

export const usePageBySlug = (userId: string, slug: string) =>
    useQuery(getPageBySlug(userId, slug));

export const getPages = (userId: string) =>
    queryOptions({
        queryKey: ['pages', userId],
        queryFn: async (): Promise<PageListResponse> => {
            const response = await useApi('/pages/{user_id}', 'get', {
                path: { user_id: userId },
            });

            return response.data;
        },
    });

export const usePages = (userId: string) => useQuery(getPages(userId));

export const getCategories = (userId: string) =>
    queryOptions({
        queryKey: ['pages', 'categories', userId],
        queryFn: async (): Promise<{ categories: string[] }> => {
            const response = await useApi(
                '/pages/{user_id}/categories',
                'get',
                {
                    path: { user_id: userId },
                }
            );

            return response.data;
        },
    });

export const useCategories = (userId: string) =>
    useQuery(getCategories(userId));

export const useCreatePage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            formData: components['schemas']['CreatePageRequest']
        ) => {
            const response = await useApi('/pages', 'post', {
                contentType: 'application/json; charset=utf-8',
                data: formData,
            });

            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['pages', variables.user_id],
            });
            toast.success('Page created successfully');
        },
        onError: () => {
            toast.error('Failed to create page');
        },
    });
};

export const useUpdatePage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: {
            original_slug: string;
            slug: string;
            user_id: string;
            name: string;
            page_type: string;
            config: string;
            category?: string;
        }) => {
            const data: components['schemas']['UpdatePageRequest'] = {
                name: formData.name,
                slug: formData.slug,
                page_type: formData.page_type,
                config: formData.config,
                category: formData.category,
            };

            const response = await useApi('/pages/{slug}', 'put', {
                path: { slug: formData.original_slug },
                contentType: 'application/json; charset=utf-8',
                data: data,
            });

            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['pages', variables.user_id],
            });
            toast.success('Page updated successfully');
        },
        onError: () => {
            toast.error('Failed to update page');
        },
    });
};

export const useDeletePage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            slug,
            userId,
        }: {
            slug: string;
            userId: string;
        }) => {
            const response = await useApi('/pages/{slug}', 'delete', {
                path: { slug },
            });

            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['pages', variables.userId],
            });
            toast.success('Page deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete page');
        },
    });
};
