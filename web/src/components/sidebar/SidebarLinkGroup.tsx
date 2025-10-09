import { FC } from 'react';

import { SidebarLink } from './SidebarLink';
import { NavGroup } from './types';

type SidebarLinkGroupProperties = {
    group: NavGroup;
};

export const SidebarLinkGroup: FC<SidebarLinkGroupProperties> = ({ group }) => {
    return (
        <li className="">
            {group.label && (
                <div className="px-3.5 text-sm font-bold text-gray-500">
                    {group.label}
                </div>
            )}
            <ul className="">
                {group.items.map((item) => (
                    <SidebarLink
                        key={(item.to + item.label) as string}
                        item={item}
                    />
                ))}
            </ul>
        </li>
    );
};
