import { Command, HomeIcon, Inbox, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  activeContext,
  ContextSwitcher,
  SearchForm,
  type CommandPaletteGroup,
  type ContextOption,
  type RootBreadcrumb,
  type RootSidebarContent,
} from '@synapcity/frontend-shells';

import type { SidebarRecords } from '@/lib/sidebar-records';
import { homePathFor, settingsPathFor } from '@/lib/routing/user-paths';

import { COLLECTIONS, type CollectionKind } from './collections';

/** What the active context is called when the trail names no place. */
const HOME_LABEL = 'Home';

/** What the sidebar needs from the app shell besides the trail. */
export type AppSidebarOptions = {
  records: SidebarRecords;
  onOpenPalette: () => void;
  onSearch: (query: string) => void;
  onCreate: (kind: CollectionKind) => void;
  /** The account menu, rendered on the server and pinned to the sidebar's foot. */
  footer?: ReactNode;
};

/** The places the context switcher offers, in this order. */
function contextOptions(userId: string): ContextOption[] {
  return [
    { label: HOME_LABEL, href: homePathFor(userId) },
    ...COLLECTIONS.map((c) => ({ label: c.label, href: c.indexHref(userId) })),
  ];
}

/**
 * The signed-in sidebar: the context switcher, then the core links and
 * actions, a search field, and one section per collection (a link to its page,
 * a quick-create button and its latest records), with the account menu at the
 * foot. Changing the navigation means changing this data, not the shell.
 */
export function appSidebar(
  userId: string,
  trail: RootBreadcrumb[],
  pathname: string,
  { records, onOpenPalette, onSearch, onCreate, footer }: AppSidebarOptions,
): RootSidebarContent {
  const current = activeContext(trail)?.label ?? HOME_LABEL;
  const link = (title: string, href: string, icon?: typeof HomeIcon) => ({
    title,
    href,
    icon,
    isActive: href === pathname,
  });

  return {
    header: (
      <ContextSwitcher current={current} options={contextOptions(userId)} />
    ),
    groups: [
      {
        items: [
          link(HOME_LABEL, homePathFor(userId), HomeIcon),
          { title: 'Command palette', onSelect: onOpenPalette, icon: Command },
          // No Inbox route yet: capture and intake are an open product
          // decision (PRODUCT.md), so the entry links nowhere until then.
          { title: 'Inbox', href: '#', icon: Inbox },
          link('Settings', settingsPathFor(userId), Settings),
        ],
      },
      { content: <SearchForm onSearch={onSearch} /> },
      ...COLLECTIONS.map((collection) => ({
        title: collection.label,
        href: collection.indexHref(userId),
        action: {
          label: `New ${collection.singular}`,
          onSelect: () => onCreate(collection.kind),
        },
        items: records[collection.records].map((record) =>
          link(
            record.name,
            collection.itemHref(userId, record.id),
            collection.icon,
          ),
        ),
        empty: `No ${collection.label.toLowerCase()} yet`,
        // Folded to icons, every record would show its collection's icon.
        hideWhenCollapsed: true,
      })),
    ],
    footer,
  };
}

/** The command palette's groups: places to go, the latest records, and creating. */
export function appPaletteGroups(
  userId: string,
  records: SidebarRecords,
  onCreate: (kind: CollectionKind) => void,
): CommandPaletteGroup[] {
  return [
    {
      heading: 'Go to',
      items: [
        { label: HOME_LABEL, href: homePathFor(userId), icon: HomeIcon },
        ...COLLECTIONS.map((c) => ({
          label: c.label,
          href: c.indexHref(userId),
          icon: c.icon,
        })),
        { label: 'Settings', href: settingsPathFor(userId), icon: Settings },
      ],
    },
    ...COLLECTIONS.map((collection) => ({
      heading: collection.label,
      items: records[collection.records].map((record) => ({
        label: record.name,
        href: collection.itemHref(userId, record.id),
        icon: collection.icon,
      })),
    })),
    {
      heading: 'Create',
      items: COLLECTIONS.map((collection) => ({
        label: `New ${collection.singular}`,
        onSelect: () => onCreate(collection.kind),
        icon: collection.icon,
      })),
    },
  ];
}
