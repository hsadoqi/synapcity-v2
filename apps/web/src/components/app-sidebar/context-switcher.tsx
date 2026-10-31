'use client';

import {
  spacePathFor,
  homePathFor,
  spacesPathFor,
} from '@/lib/routing/user-paths';
import { SidebarRecords } from '@/lib/sidebar-records';
import { EntityIcon } from '@synapcity/frontend-collection';
import {
  RootBreadcrumb,
  activeContext,
  ContextSwitcher,
} from '@synapcity/frontend-shells';
import { Globe } from 'lucide-react';
import { within } from './utils';
/** The context switcher's name for working across Synapcity, outside any Space. */
const GLOBAL_LABEL = 'Global';

/**
 * The context switcher: working globally, or inside one of the latest Spaces,
 * with a link to every Space. The active one comes from the trail's Space
 * crumb, matched by path, since two Spaces can share a name. A Space shows its
 * stored icon; one that is missing, unknown or not among the latest Spaces
 * shows the folder (ADR-0012). Global is not a Space, so it has its own icon.
 */
export function contextSwitcher(
  userId: string,
  trail: RootBreadcrumb[],
  pathname: string,
  spaces: SidebarRecords['spaces'],
) {
  const space = activeContext(trail);
  let activeIcon: string | undefined;
  const options = spaces.map((record) => {
    const href = spacePathFor(userId, record.id);
    const active = space !== null && within(pathname, href);
    if (active) activeIcon = record.icon;
    return { label: record.name, href, active: href === pathname };
  });
  const current = space?.label ?? GLOBAL_LABEL;
  return (
    <ContextSwitcher
      current={current}
      icon={
        space ? (
          <EntityIcon name={activeIcon ?? ''} className="size-4" />
        ) : (
          <Globe className="size-4" />
        )
      }
      options={[
        { label: GLOBAL_LABEL, href: homePathFor(userId), active: !space },
        ...options,
      ]}
      more={{ label: 'All spaces', href: spacesPathFor(userId) }}
    />
  );
}
