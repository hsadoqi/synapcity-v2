'use client';

import { homePathFor, settingsPathFor } from '@/lib/routing/user-paths';
import type { SidebarRecords } from '@/lib/sidebar-records';
import { CommandPaletteGroup } from '@synapcity/frontend-shells';
import { HomeIcon, Settings } from 'lucide-react';
import { COLLECTIONS, type CollectionKind } from '../collections';

export const HOME_LABEL = 'Home';

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
