import { For, Show } from 'solid-js';

import { SidebarLink } from './SidebarLink';
import { NavGroup } from './types';

type SidebarLinkGroupProperties = {
    group: NavGroup;
};

export const SidebarLinkGroup = (props: SidebarLinkGroupProperties) => (
    <li class="">
        <Show when={props.group.label}>
            <div class="px-3.5 text-sm font-bold text-gray-500">
                {props.group.label}
            </div>
        </Show>
        <ul class="">
            <For each={props.group.items}>
                {(item) => <SidebarLink item={item} />}
            </For>
        </ul>
    </li>
);
