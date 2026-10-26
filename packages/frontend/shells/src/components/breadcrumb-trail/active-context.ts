import type { RootBreadcrumb } from '../root-shell/root-header';

/**
 * The place a page's trail puts it in: its Space crumb when it has one (so a
 * document inside a Space keeps that Space), otherwise its collection crumb,
 * otherwise none, which the host shows as its home. The sidebar reads the same
 * trail as the breadcrumbs, so the two cannot disagree.
 */
export function activeContext(trail: RootBreadcrumb[]): RootBreadcrumb | null {
  return (
    trail.find((crumb) => crumb.kind === 'space') ??
    trail.find((crumb) => crumb.kind === 'collection') ??
    null
  );
}
