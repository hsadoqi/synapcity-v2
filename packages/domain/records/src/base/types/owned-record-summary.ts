import type { BaseRecord } from './base-record';

/**
 * A document or dashboard as the server reads it for an index: the base record
 * plus how many Spaces it takes part in (ADR-0013 participation tables). The
 * Space equivalent is `SpaceSummary` in `domain-spaces`.
 */
export type OwnedRecordSummary = BaseRecord & { spacesTotal: number };
