import { Link } from '@tanstack/react-router';
import { FiSettings } from 'react-icons/fi';
import {
    LuBell,
    LuCalendar,
    LuCog,
    LuFileText,
    LuGavel,
    LuHome,
    LuKeyRound,
    LuMail,
    LuNewspaper,
    LuShieldAlert,
    LuStickyNote,
    LuTruck,
    LuUserPlus,
} from 'react-icons/lu';
import { match, P } from 'ts-pattern';

import { useImapConfigs } from '@/api/imapConfig';

import { SidebarLinkGroup } from './SidebarLinkGroup';
import { createNavGroup, createNavItem } from './types';

const defaultNav = [
    createNavGroup({
        items: [
            createNavItem({
                label: 'Home',
                icon: <LuHome className="w-4 h-4" />,
                to: '/' as const,
            }),
            createNavItem({
                label: 'Important',
                icon: <LuBell className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'important' },
            }),
            createNavItem({
                label: 'Calendar',
                icon: <LuCalendar className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'calendar' },
            }),
        ],
        label: '',
    }),
    createNavGroup({
        label: 'News & Updates',
        items: [
            createNavItem({
                label: 'Newsletters',
                icon: <LuNewspaper className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'news' },
            }),
            createNavItem({
                label: 'Legal',
                icon: <LuGavel className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'legal' },
            }),
        ],
    }),
    createNavGroup({
        label: 'Authentication',
        items: [
            createNavItem({
                label: '2FA & SSO',
                icon: <LuKeyRound className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'authentication' },
            }),
            createNavItem({
                label: 'Compromises',
                icon: <LuShieldAlert className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'compromises' },
            }),
        ],
    }),
    createNavGroup({
        label: 'Spending & Going',
        items: [
            createNavItem({
                label: 'Receipts',
                icon: <LuFileText className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'receipts' },
            }),
            createNavItem({
                label: 'Shipping',
                icon: <LuTruck className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'shipping' },
            }),
        ],
    }),
    createNavGroup({
        label: 'Calendar',
        items: [
            createNavItem({
                label: 'Invites',
                icon: <LuUserPlus className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'calendar-invites' },
            }),
            createNavItem({
                label: 'Meeting Notes',
                icon: <LuStickyNote className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'meeting-notes' },
            }),
        ],
    }),
    createNavGroup({
        label: 'Untrusted',
        items: [
            createNavItem({
                label: 'Everything',
                icon: <LuMail className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'everything' },
            }),
            createNavItem({
                label: 'Junk',
                icon: <LuMail className="w-4 h-4" />,
                to: '/t/$tag',
                pathParams: { tag: 'junk' },
            }),
        ],
    }),
] as const;

export const Sidebar = () => {
    const { data: configs, isLoading } = useImapConfigs();
    const configLength = configs?.configs.length;

    return (
        <aside className="w-80 bg-sidebar border-r border-card-border flex flex-col">
            <div className="p-4 ">
                <h1 className="text-xl font-bold">🐕 Maildog</h1>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
                <ul className="space-y-3">
                    {defaultNav.map((nav, index) => (
                        <SidebarLinkGroup key={index} group={nav} />
                    ))}
                </ul>
                {match({ isLoading, configLength })
                    .with({ isLoading: true, configLength: undefined }, () => (
                        <div className="text-center text-gray-500 py-8 px-4">
                            Loading...
                        </div>
                    ))
                    .with({ isLoading: false, configLength: 0 }, () => (
                        <div className="text-center text-gray-500 py-8 px-4">
                            <FiSettings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No email accounts yet </p>
                        </div>
                    ))
                    .with(
                        { isLoading: false, configLength: P.number.gte(1) },
                        () => (
                            <div className="">
                                <div className="px-3.5 text-sm font-bold text-gray-500">
                                    Accounts
                                </div>
                                <ul className="">
                                    {configs?.configs.map((config) => (
                                        <Link
                                            key={config.id}
                                            to="/m/$mail"
                                            params={{ mail: String(config.id) }}
                                            className="flex px-4 py-1 transition-all cursor-pointer hover:bg-surface-primary"
                                            activeProps={{
                                                className: 'bg-surface-primary',
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="w-full flex items-center gap-1">
                                                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                                                        {config.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-600 truncate">
                                                        {config.username}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* 
                                        <div className="flex gap-1 mt-2" >
                                        <button
                                        onClick={
                                            (e) => {
                                                e.stopPropagation();
                                                // setEditingConfig(config);
                                                }
                                                }
                                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                >
                                                <FiEdit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // handleDelete(config.id);
                                                    }}
                                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                    // disabled={deletePending}
                                                    >
                                                    <FiTrash2 className="w-3 h-3" />
                                                    </button>
                                                    </div> */}
                                        </Link>
                                    ))}
                                </ul>
                            </div>
                        )
                    )
                    .otherwise(() => (
                        <div className="text-center text-gray-500 py-8">
                            Something went wrong
                        </div>
                    ))}
            </div>

            <div className="p-1 border-t border-gray-200">
                <Link
                    to="/configure"
                    // onClick = {() => setShowAddForm(true)}
                    className="w-full text-sm text-neutral-700 py-2 rounded-lg font-medium hover:bg-neutral-100 transition-colors flex items-center justify-start px-3 gap-2"
                >
                    <LuCog className="w-4 h-4" />
                    Configure
                </Link>
            </div>
        </aside>
    );
};
