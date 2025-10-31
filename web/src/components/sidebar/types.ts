import type { JSX } from '@solidjs/web';
import {
    MakeOptionalPathParams,
    RegisteredRouter,
} from '@tanstack/solid-router';
import { Component } from 'solid-js';

import { FileRoutesByTo } from '@/routeTree.gen';

export type NavItem<T extends ToPathOption<RegisteredRouter>> = {
    label: string;
    icon: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
    to: T;
    pathParams?: MakeOptionalPathParams<
        RegisteredRouter,
        FileRoutesByTo,
        T
    >['params'];
};

// Use a union type to allow items with different specific route types
export type AnyNavItem = {
    [K in keyof FileRoutesByTo]: NavItem<K>;
}[keyof FileRoutesByTo];

export type NavGroup = {
    label: string;
    items: (AnyNavItem | NavItem<string>)[];
};

// Helper function to create properly typed nav items
export const createNavItem = <T extends ToPathOption<RegisteredRouter>>(
    item: NavItem<T>
): NavItem<T> => item;

export const createNavGroup = (group: NavGroup): NavGroup => group;
