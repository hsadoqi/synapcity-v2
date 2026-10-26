import type { BaseRecord } from '@synapcity/domain-records';

/**
 * A saved dashboard record: name, owner and timestamps, not its widgets. It is
 * what `dashboardSchema` parses, which is the base record; written as the base
 * type so the types never import the schemas, which import these types.
 */
export type DashboardEntity = BaseRecord;

/**
 * A dashboard as the index lists it: the saved record plus how many Spaces it
 * takes part in. The count is derived from participation, not stored on the
 * dashboard (ADR-0013, items 2 and 3).
 */
export type DashboardSummary = DashboardEntity & { spacesTotal: number };
