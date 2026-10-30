'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { RootShell } from '../root-shell';
import type { RootBreadcrumb } from '../header-breadcrumbs';
import type { RootSidebarContent } from '../sidebar-shell/root-sidebar';

type BreadcrumbTrail = (items: RootBreadcrumb[]) => void;

const BreadcrumbTrailContext = createContext<BreadcrumbTrail>(() => {});

// One shared empty trail, so clearing an already empty trail is no change and
// the shell does not render again.
const NO_TRAIL: RootBreadcrumb[] = [];

/**
 * The root shell, holding the breadcrumb trail for the page inside it. The
 * header sits in the root layout, above every page, so a page cannot pass it
 * props; it renders <SetBreadcrumbs> instead and this keeps what it said.
 */
export function BreadcrumbProvider({
  children,
  sidebar,
  ...shellProps
}: Omit<ComponentProps<typeof RootShell>, 'breadcrumbs' | 'sidebar'> & {
  /**
   * The sidebar's content, or a function that builds it from the page's trail
   * so it can follow the page (see `activeContext`).
   */
  sidebar?:
    RootSidebarContent | ((trail: RootBreadcrumb[]) => RootSidebarContent);
}) {
  const [trail, setTrail] = useState<RootBreadcrumb[]>(NO_TRAIL);
  const sidebarContent =
    typeof sidebar === 'function' ? sidebar(trail) : sidebar;

  return (
    <BreadcrumbTrailContext value={setTrail}>
      <RootShell {...shellProps} breadcrumbs={trail} sidebar={sidebarContent}>
        {children}
      </RootShell>
    </BreadcrumbTrailContext>
  );
}

/**
 * Tells the header where this page sits. Renders nothing, and clears the trail
 * when the page goes away so the next page never shows a stale one.
 *
 * The primary navigable route owns the trail and publishes at most one
 * (ADR-0017): exactly one when it shows a trail, none when it is trail-free.
 * Resource views, contextual panel destinations and drawers never render this.
 * The shell keeps a single trail: if two of these are mounted, the last to run
 * wins and either one unmounting clears it. Route layouts that need a crumb of
 * their own should be folded into the page's items rather than publishing a
 * second trail.
 */
export function useBreadcrumbs({ items }: { items: RootBreadcrumb[] }) {
  const context = useContext(BreadcrumbTrailContext);
  // A new array arrives on every render; compare by value so the effect runs
  // only when the trail actually changes.
  const key = JSON.stringify(items);

  useEffect(() => {
    context(JSON.parse(key) as RootBreadcrumb[]);
    return () => context(NO_TRAIL);
  }, [key, context]);

  return null;
}
