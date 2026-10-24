import type { DashboardItem, DocumentItem } from '../../../contracts';

/*
 * Where Space pages are, under the home address the host supplies (the host
 * owns how a user's address is encoded). One place for the Space's own route
 * and for each item's route nested in it (ADR-0013, item 9), so the sections
 * and the recent list cannot drift apart.
 */

/** A Space's own page. */
export function spacePath(homePath: string, spaceId: string): string {
  return `${homePath}/spaces/${spaceId}`;
}

/** A document or dashboard at its route nested in the Space. */
export function spaceItemPath(
  homePath: string,
  spaceId: string,
  item: Pick<DocumentItem | DashboardItem, 'id' | 'kind'>,
): string {
  return `${spacePath(homePath, spaceId)}/${item.kind}s/${item.id}`;
}
