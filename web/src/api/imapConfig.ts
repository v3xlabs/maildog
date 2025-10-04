import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApi } from './api';
import { components } from './schema.gen';

export type ImapConfigResponse = components['schemas']['ImapConfigResponse'];
export type ImapConfigListResponse = components['schemas']['ImapConfigListResponse'];
export type ImapConfigDetailResponse = components['schemas']['ImapConfigDetailResponse'];

export const getImapConfigs = () =>
    queryOptions({
        queryKey: ['imap-configs'],
        queryFn: async (): Promise<ImapConfigListResponse> => {
            const response = await useApi('/imap-configs', 'get', {});
            return response.data;
        },
    });

export const useImapConfigs = () => useQuery(getImapConfigs());

export const useCreateImapConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: {
            name: string;
            mail_host: string;
            mail_port: number;
            username: string;
            password: string;
            use_tls?: boolean;
        }) => {
            const data: components['schemas']['CreateImapConfigRequest'] = {
                name: formData.name,
                mail_host: formData.mail_host,
                mail_port: formData.mail_port,
                username: formData.username,
                password: formData.password,
                use_tls: formData.use_tls ?? true,
            };
            const response = await useApi('/imap-configs', 'post', {
                contentType: 'application/json; charset=utf-8',
                data,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imap-configs'] });
            toast.success('IMAP configuration created successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create IMAP configuration');
        },
    });
};

export const useUpdateImapConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: {
                name?: string;
                mail_host?: string;
                mail_port?: number;
                username?: string;
                password?: string;
                use_tls?: boolean;
            };
        }) => {
            const response = await useApi('/imap-configs/{id}', 'put', {
                path: { id },
                contentType: 'application/json; charset=utf-8',
                data,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imap-configs'] });
            toast.success('IMAP configuration updated successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update IMAP configuration');
        },
    });
};

export const useDeleteImapConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await useApi('/imap-configs/{id}', 'delete', {
                path: { id },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imap-configs'] });
            toast.success('IMAP configuration deleted successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to delete IMAP configuration');
        },
    });
};
