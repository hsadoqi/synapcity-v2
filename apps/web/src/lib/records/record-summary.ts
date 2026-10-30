import type { BaseRecord } from '@synapcity/domain-records';

/** The app's document/dashboard index projection. */
export type RecordSummary = BaseRecord & { spacesTotal: number };
