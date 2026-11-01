'use client';

import { useBreadcrumbs } from '../breadcrumb-trail';
import type { RootBreadcrumb } from '../header-breadcrumbs';

/**
 * Tells the shell where this page sits (ADR-0017). A signed-in route's
 * `page.tsx` renders it once, or not at all when the route is trail-free. It
 * renders nothing in place: the header draws the trail and the sidebar reads
 * the same trail through `activeContext`, so the two cannot disagree. The trail
 * clears when the page goes away.
 */
export const PublishBreadcrumbs = ({ items }: { items?: RootBreadcrumb[] }) =>
  useBreadcrumbs({ items: items ?? [] });
