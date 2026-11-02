'use client';

import type { ReactNode } from 'react';
import {
  type RootBreadcrumb,
  type RootSidebarContent,
} from '@synapcity/frontend-shells';

import type { SidebarRecords } from '../../lib/sidebar-records';
import { homePathFor, settingsPathFor } from '../../lib/routing/user-paths';

import { COLLECTIONS, type CollectionKind } from '../collections';
import { HOME_LABEL } from './app-palette-groups';
import { recordItem } from './utils';
import { contextSwitcher } from './context-switcher';
import { HomeIcon, Search, Inbox, Settings } from 'lucide-react';

/** What the sidebar needs from the app shell besides the trail. */
export type AppSidebarOptions = {
  records: SidebarRecords;
  onOpenPalette: () => void;
  onCreate: (kind: CollectionKind) => void;
  /** The account menu, rendered on the server and pinned to the sidebar's foot. */
  footer?: ReactNode;
};

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
