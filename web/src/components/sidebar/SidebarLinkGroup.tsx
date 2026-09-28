import { For, Show } from "solid-js";

import { SidebarLink } from "./SidebarLink";
import { NavGroup } from "./types";

type SidebarLinkGroupProperties = {
  group: NavGroup;
};

export const SidebarLinkGroup = (properties: SidebarLinkGroupProperties) => (
  <li class="">
    <Show when={properties.group.label}>
      <div class="px-3.5 text-sm font-bold text-gray-500">
        {properties.group.label}
      </div>
    </Show>
    <ul class="">
      <For each={properties.group.items}>
        {item => <SidebarLink item={item} />}
      </For>
    </ul>
  </li>
);
