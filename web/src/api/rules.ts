import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { useApi } from './api';
import { components } from './schema.gen';

export type RuleResponse = components['schemas']['RuleResponse'];
export type RuleListResponse = components['schemas']['RuleListResponse'];
export type CreateRuleRequest = components['schemas']['CreateRuleRequest'];
export type UpdateRuleRequest = components['schemas']['UpdateRuleRequest'];
export type MessageResponse = components['schemas']['MessageResponse'];

export const getRules = () =>
    queryOptions({
        queryKey: ['rules'],
        queryFn: async (): Promise<RuleListResponse> => {
            const response = await useApi('/rules', 'get', {});

            return response.data;
        },
    });

export const useRules = () => useQuery(getRules());

export const useCreateRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: {
            name: string;
            condition: unknown;
            actions: unknown[];
            priority: number;
            enabled: boolean;
        }) => {
            const data: CreateRuleRequest = {
                name: formData.name,
                condition: formData.condition,
                actions: formData.actions,
                priority: formData.priority,
                enabled: formData.enabled,
            };
            const response = await useApi('/rules', 'post', {
                contentType: 'application/json; charset=utf-8',
                data,
            });

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            toast.success('Rule created successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create rule');
        },
    });
};

export const useUpdateRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: {
                name: string;
                condition: unknown;
                actions: unknown[];
                priority: number;
                enabled: boolean;
            };
        }) => {
            const updateData: UpdateRuleRequest = {
                name: data.name,
                condition: data.condition,
                actions: data.actions,
                priority: data.priority,
                enabled: data.enabled,
            };
            const response = await useApi('/rules/{id}', 'put', {
                path: { id },
                contentType: 'application/json; charset=utf-8',
                data: updateData,
            });

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            toast.success('Rule updated successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update rule');
        },
    });
};

export const useDeleteRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await useApi('/rules/{id}', 'delete', {
                path: { id },
            });

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            toast.success('Rule deleted successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to delete rule');
        },
    });
};