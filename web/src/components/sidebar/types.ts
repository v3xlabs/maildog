import {
    MakeOptionalPathParams,
    RegisteredRouter,
} from '@tanstack/react-router';

import { FileRoutesByTo } from '@/routeTree.gen';

export type NavItem<T extends keyof FileRoutesByTo = keyof FileRoutesByTo> = {
    label: string;
    icon: React.ReactNode;
    to: T;
    pathParams?: MakeOptionalPathParams<
        RegisteredRouter,
        keyof FileRoutesByTo,
        T
    >['params'];
};

// Use a union type to allow items with different specific route types
export type AnyNavItem = {
    [K in keyof FileRoutesByTo]: NavItem<K>;
}[keyof FileRoutesByTo];

export type NavGroup = {
    label: string;
    items: AnyNavItem[];
};

// Helper function to create properly typed nav items
export const createNavItem = <T extends keyof FileRoutesByTo>(
    item: NavItem<T>
): NavItem<T> => item;

export const createNavGroup = (group: NavGroup): NavGroup => group;
