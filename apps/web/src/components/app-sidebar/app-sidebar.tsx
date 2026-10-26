import { HomeIcon, Inbox, Search, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  activeContext,
  ContextSwitcher,
  type CommandPaletteGroup,
  type RootBreadcrumb,
  type RootSidebarContent,
  type RootSidebarItem,
} from '@synapcity/frontend-shells';

import type { SidebarRecords } from '../../lib/sidebar-records';
import {
  homePathFor,
  settingsPathFor,
  spacePathFor,
  spacesPathFor,
} from '../../lib/routing/user-paths';

import { COLLECTIONS, type CollectionKind } from './collections';

const HOME_LABEL = 'Home';
/** The context switcher's name for working across Synapcity, outside any Space. */
const GLOBAL_LABEL = 'Global';

/** What the sidebar needs from the app shell besides the trail. */
export type AppSidebarOptions = {
  records: SidebarRecords;
  onOpenPalette: () => void;
  onCreate: (kind: CollectionKind) => void;
  /** The account menu, rendered on the server and pinned to the sidebar's foot. */
  footer?: ReactNode;
};

/** Whether the page at `pathname` is `href` or a page under it. */
const within = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * The context switcher: working globally, or inside one of the latest Spaces,
 * with a link to every Space. The active one comes from the trail's Space
 * crumb, matched by path, since two Spaces can share a name.
 */
function contextSwitcher(
  userId: string,
  trail: RootBreadcrumb[],
  pathname: string,
  spaces: SidebarRecords['spaces'],
) {
  const space = activeContext(trail);
  const options = spaces.map((record) => {
    const href = spacePathFor(userId, record.id);
    return {
      label: record.name,
      href,
      active: space !== null && within(pathname, href),
    };
  });
  const current = space?.label ?? GLOBAL_LABEL;
  return (
    <ContextSwitcher
      current={current}
      options={[
        { label: GLOBAL_LABEL, href: homePathFor(userId), active: !space },
        ...options,
      ]}
      more={{ label: 'All spaces', href: spacesPathFor(userId) }}
    />
  );
}

/** One record in its collection's section: a link, or shown disabled while its page is not built. */
function recordItem(
  userId: string,
  record: { id: string; name: string },
  collection: (typeof COLLECTIONS)[number],
  pathname: string,
): RootSidebarItem {
  if (!collection.itemHref) {
    return { title: record.name, icon: collection.icon, disabled: true };
  }
  const href = collection.itemHref(userId, record.id);
  return {
    title: record.name,
    href,
    icon: collection.icon,
    isActive: href === pathname,
  };
}

/**
 * The signed-in sidebar: the context switcher (Global or a Space), then the
 * core links and search, and one section per collection (a link to its page, a
 * quick-create button and its latest records), with the account menu at the
 * foot. Changing the navigation means changing this data, not the shell.
 */
export function appSidebar(
  userId: string,
  trail: RootBreadcrumb[],
  pathname: string,
  { records, onOpenPalette, onCreate, footer }: AppSidebarOptions,
): RootSidebarContent {
  const link = (title: string, href: string, icon?: typeof HomeIcon) => ({
    title,
    href,
    icon,
    isActive: href === pathname,
  });

  return {
    header: contextSwitcher(userId, trail, pathname, records.spaces),
    groups: [
      {
        items: [
          link(HOME_LABEL, homePathFor(userId), HomeIcon),
          // Opens the command palette (also Cmd/Ctrl+K), which searches
          // places, the latest records and create actions.
          { title: 'Search', onSelect: onOpenPalette, icon: Search },
          // No Inbox route yet: capture and intake are an open product
          // decision (PRODUCT.md), so the entry is shown but disabled.
          { title: 'Inbox', icon: Inbox, disabled: true, note: 'Soon' },
          link('Settings', settingsPathFor(userId), Settings),
        ],
      },
      ...COLLECTIONS.map((collection) => ({
        title: collection.label,
        href: collection.indexHref(userId),
        action: {
          label: `New ${collection.singular}`,
          onSelect: () => onCreate(collection.kind),
        },
        items: records[collection.records].map((record) =>
          recordItem(userId, record, collection, pathname),
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
        icon: collection.icon,
        ...(collection.itemHref
          ? { href: collection.itemHref(userId, record.id) }
          : { disabled: true }),
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
