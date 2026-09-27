import { Dynamic } from '@solidjs/web';
import { Link } from '@tanstack/solid-router';
import ChevronRightIcon from '~icons/lucide/chevron-right';

import { AnyNavItem } from './types';

type SidebarLinkProperties = {
    item: AnyNavItem;
};

export const SidebarLink = (props: SidebarLinkProperties) => (
    <li class="border-y transition-all cursor-pointer hover:bg-surface-hover">
        <Link
            to={props.item.to}
            params={props.item.pathParams}
            class="flex items-center justify-between gap-2 px-4 py-1"
            activeProps={{ class: 'bg-surface-primary' }}
        >
            <div class="flex items-center gap-2 flex-1">
                <Dynamic component={props.item.icon} class="w-4 h-4" />
                {props.item.label}
            </div>
            <div>
                <ChevronRightIcon class="w-4 h-4" />
            </div>
        </Link>
    </li>
);
