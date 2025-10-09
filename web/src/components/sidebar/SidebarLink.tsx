import { Link } from '@tanstack/react-router';
import { FiChevronRight } from 'react-icons/fi';

import { AnyNavItem } from './types';

type SidebarLinkProperties = {
    item: AnyNavItem;
};

export const SidebarLink = ({ item }: SidebarLinkProperties) => {
    return (
        <li className="border-y transition-all cursor-pointer hover:bg-surface-hover">
            <Link
                to={item.to}
                params={item.pathParams}
                className="flex items-center justify-between gap-2 px-4 py-1"
                activeProps={{ className: 'bg-surface-primary' }}
            >
                <div className="flex items-center gap-2 flex-1">
                    {item.icon}
                    {item.label}
                </div>
                <div>
                    <FiChevronRight className="w-4 h-4" />
                </div>
            </Link>
        </li>
    );
};
