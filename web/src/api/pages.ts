import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { useApi } from './api';
import { components } from './schema.gen';

// Extend the generated types to include category field
export type PageResponse = components['schemas']['PageResponse'] & {
    category?: string;
};
export type PageListResponse = components['schemas']['PageListResponse'];
export type CreatePageRequest = components['schemas']['CreatePageRequest'] & {
    category?: string;
};
export type UpdatePageRequest = components['schemas']['UpdatePageRequest'] & {
    category?: string;
};
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

export const usePageBySlug = (userId: string, slug: string) => useQuery(getPageBySlug(userId, slug));

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

export const useCreatePage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: CreatePageRequest) => {
            const response = await useApi('/pages', 'post', {
                contentType: 'application/json; charset=utf-8',
                data: formData,
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pages', variables.user_id] });
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
            slug: string;
            user_id: string;
            name: string;
            page_type: string;
            config: string;
            position: number;
            category?: string;
        }) => {
            const data: UpdatePageRequest = {
                name: formData.name,
                slug: formData.slug,
                page_type: formData.page_type,
                config: formData.config,
                position: formData.position,
                category: formData.category,
            };

            const response = await useApi('/pages/{slug}', 'put', {
                path: { slug: formData.slug },
                contentType: 'application/json; charset=utf-8',
                data: data,
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pages', variables.user_id] });
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
        mutationFn: async ({ slug, userId }: { slug: string; userId: string }) => {
            const response = await useApi('/pages/{slug}', 'delete', {
                path: { slug },
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pages', variables.userId] });
            toast.success('Page deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete page');
        },
    });
};
