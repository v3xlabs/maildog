import { Link } from '@tanstack/solid-router';
import BellIcon from '~icons/lucide/bell';
import CalendarIcon from '~icons/lucide/calendar';
import CogIcon from '~icons/lucide/cog';
import FileTextIcon from '~icons/lucide/file-text';
import GavelIcon from '~icons/lucide/gavel';
import HouseIcon from '~icons/lucide/house';
import KeyRoundIcon from '~icons/lucide/key-round';
import MailIcon from '~icons/lucide/mail';
import NewspaperIcon from '~icons/lucide/newspaper';
import SettingsIcon from '~icons/lucide/settings';
import ShieldAlertIcon from '~icons/lucide/shield-alert';
import StickyNoteIcon from '~icons/lucide/sticky-note';
import TruckIcon from '~icons/lucide/truck';
import UserPlusIcon from '~icons/lucide/user-plus';
import { Errored, For, Loading, Show } from 'solid-js';

import { useImapConfigs } from '@/api/imapConfig';
import { usePages, PageResponse } from '@/api/pages';

import { SidebarLinkGroup } from './SidebarLinkGroup';
import { createNavGroup, createNavItem } from './types';

const defaultNav = [
    createNavGroup({
        items: [
            createNavItem({
                label: 'Home',
                icon: HouseIcon,
                to: '/' as const,
            }),
            createNavItem({
                label: 'Important',
                icon: BellIcon,
                to: '/t/$tag',
                pathParams: { tag: 'important' },
            }),
            createNavItem({
                label: 'Calendar',
                icon: CalendarIcon,
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
                icon: NewspaperIcon,
                to: '/t/$tag',
                pathParams: { tag: 'news' },
            }),
            createNavItem({
                label: 'Legal',
                icon: GavelIcon,
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
                icon: KeyRoundIcon,
                to: '/t/$tag',
                pathParams: { tag: 'authentication' },
            }),
            createNavItem({
                label: 'Compromises',
                icon: ShieldAlertIcon,
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
                icon: FileTextIcon,
                to: '/t/$tag',
                pathParams: { tag: 'receipts' },
            }),
            createNavItem({
                label: 'Shipping',
                icon: TruckIcon,
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
                icon: UserPlusIcon,
                to: '/t/$tag',
                pathParams: { tag: 'calendar-invites' },
            }),
            createNavItem({
                label: 'Meeting Notes',
                icon: StickyNoteIcon,
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
                icon: MailIcon,
                to: '/t/$tag',
                pathParams: { tag: 'everything' },
            }),
            createNavItem({
                label: 'Junk',
                icon: MailIcon,
                to: '/t/$tag',
                pathParams: { tag: 'junk' },
            }),
        ],
    }),
] as const;

export const Sidebar = () => {
    const configs = useImapConfigs();

    return (
        <aside class="w-80 bg-sidebar border-r border-card-border flex flex-col">
            <div class="p-4 ">
                <h1 class="text-xl font-bold">🐕 Maildog</h1>
            </div>

            <div class="flex-1 overflow-y-auto space-y-3">
                <ul class="space-y-3">
                    <For each={defaultNav}>
                        {(nav) => <SidebarLinkGroup group={nav} />}
                    </For>
                </ul>
                <Errored
                    fallback={
                        <div class="text-center text-gray-500 py-8">
                            Something went wrong
                        </div>
                    }
                >
                    <Loading
                        fallback={
                            <div class="text-center text-gray-500 py-8 px-4">
                                Loading...
                            </div>
                        }
                    >
                        <Show
                            when={configs.data?.configs.length}
                            fallback={
                                <div class="text-center text-gray-500 py-8 px-4">
                                    <SettingsIcon class="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No email accounts yet </p>
                                </div>
                            }
                        >
                            <div class="">
                                <div class="px-3.5 text-sm font-bold text-gray-500">
                                    Accounts
                                </div>
                                <ul class="">
                                    <For each={configs.data?.configs}>
                                        {(config) => (
                                            <Link
                                                to="/m/$mail"
                                                params={{ mail: String(config.id) }}
                                                class="flex px-4 py-1 transition-all cursor-pointer hover:bg-surface-primary"
                                                activeProps={{
                                                    class: 'bg-surface-primary',
                                                }}
                                            >
                                                <div class="flex items-start justify-between">
                                                    <div class="w-full flex items-center gap-1">
                                                        <h3 class="font-semibold text-sm text-gray-900 truncate">
                                                            {config.name}
                                                        </h3>
                                                        <p class="text-xs text-gray-600 truncate">
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
                                        )}
                                    </For>
                                </ul>
                            </div>
                        </Show>
                    </Loading>
                </Errored>
            </div>

            <div class="p-1 border-t border-gray-200">
                <Link
                    to="/settings"
                    // onClick = {() => setShowAddForm(true)}
                    class="w-full text-sm text-neutral-700 py-2 rounded-lg font-medium hover:bg-neutral-100 transition-colors flex items-center justify-start px-3 gap-2 group"
                >
                    <CogIcon class="w-4 h-4" />
                    <span class="opacity-10 group-hover:opacity-100 transition-opacity">Settings</span>
                </Link>
            </div>
        </aside>
    );
};
