import type { RecordKind } from '@synapcity/domain-records';

/**
 * One of the owner's records as the link widgets list it: the host reads them
 * (its own data, its own routes) and passes them in, so the feature package
 * knows neither a route nor a table.
 */
export type DashboardLinkItem = {
  id: string;
  kind: RecordKind;
  name: string;
  /** A Lucide icon name, as stored on the record. */
  icon: string;
  /** Where the record opens; null when the host has no page for it. */
  href: string | null;
  pinnedAt: string | null;
  lastViewedAt: string | null;
};
