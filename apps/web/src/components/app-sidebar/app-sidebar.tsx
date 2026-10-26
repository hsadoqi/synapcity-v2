import {
  activeContext,
  ContextSwitcher,
  type ContextOption,
  type RootBreadcrumb,
  type RootSidebarContent,
} from '@synapcity/frontend-shells';

import { COLLECTION_LABELS } from '@/components/breadcrumbs';
import {
  dashboardsPathFor,
  documentsPathFor,
  homePathFor,
  spacesPathFor,
} from '@/lib/routing/user-paths';

/** What the active context is called when the trail names no place. */
const HOME_LABEL = 'Home';

/** The places the context switcher offers, in this order. */
function contextOptions(userId: string): ContextOption[] {
  return [
    { label: HOME_LABEL, href: homePathFor(userId) },
    { label: COLLECTION_LABELS.spaces, href: spacesPathFor(userId) },
    { label: COLLECTION_LABELS.documents, href: documentsPathFor(userId) },
    { label: COLLECTION_LABELS.dashboards, href: dashboardsPathFor(userId) },
  ];
}

/**
 * The signed-in sidebar, built from the page's breadcrumb trail (frontend-shells
 * plan, Task 6): the context switcher names the place the page is in, the core
 * links are always on top, and a section for the active context follows.
 * Changing the navigation means changing this data, not the shell.
 */
export function appSidebar(
  userId: string,
  trail: RootBreadcrumb[],
  pathname: string,
): RootSidebarContent {
  const options = contextOptions(userId);
  const context = activeContext(trail);
  const current = context?.label ?? HOME_LABEL;
  const item = (title: string, href: string) => ({
    title,
    href,
    isActive: href === pathname,
  });

  // The page the context lives at: a crumb links to it, except on that page
  // itself, where the crumb is the current page and has no link.
  const contextHref =
    context?.href ??
    options.find((option) => option.label === context?.label)?.href ??
    pathname;

  return {
    // The inline search is hidden until there is something to search; a
    // command palette is a follow-up (plan Task 6, Step 3).
    header: <ContextSwitcher current={current} options={options} />,
    groups: [
      {
        items: [
          item(HOME_LABEL, homePathFor(userId)),
          // No Inbox route yet: capture and intake are an open product
          // decision (PRODUCT.md), so the entry links nowhere until then.
          { title: 'Inbox', href: '#' },
        ],
      },
      ...(context
        ? [{ title: current, items: [item('Overview', contextHref)] }]
        : []),
    ],
  };
}
