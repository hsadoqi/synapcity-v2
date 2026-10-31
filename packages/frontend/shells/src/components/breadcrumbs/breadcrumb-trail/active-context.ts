import type { RootBreadcrumb } from '../breadcrumb-menu';

/**
 * The Space a page's trail puts it in, so a document inside a Space keeps that
 * Space; otherwise none, which the host shows as working globally. Collection
 * pages (Spaces, Documents, Dashboards) are surfaces, not contexts (PRODUCT.md:
 * context and surface are different dimensions), so they never count. The
 * sidebar reads the same trail as the breadcrumbs, so the two cannot disagree.
 */
export function activeContext(trail: RootBreadcrumb[]): RootBreadcrumb | null {
  return trail.find((crumb) => crumb.kind === 'space') ?? null;
}
