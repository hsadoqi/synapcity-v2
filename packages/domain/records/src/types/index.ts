import type { z } from 'zod';

import type {
  baseRecordCreateSchema,
  baseRecordFieldsSchema,
  baseRecordInputSchema,
  baseRecordPatchSchema,
  baseRecordSchema,
  boundedIconSchema,
  boundedNameSchema,
  recordKindSchema,
} from '../schemas';

export type BaseRecord = z.infer<typeof baseRecordSchema>;

/**
 * A document or dashboard as the server reads it for an index: the base record
 * plus how many Spaces it takes part in (ADR-0013 participation tables). The
 * Space equivalent is `SpaceSummary` in `domain-spaces`.
 */
export type OwnedRecordSummary = BaseRecord & { spacesTotal: number };

export type BaseRecordInput = z.infer<typeof baseRecordInputSchema>;
export type BaseRecordCreate = z.infer<typeof baseRecordCreateSchema>;
export type BaseRecordPatch = z.infer<typeof baseRecordPatchSchema>;
export type BaseRecordFields = z.infer<typeof baseRecordFieldsSchema>;

export type RecordKind = z.infer<typeof recordKindSchema>;

export type BoundedIcon = z.output<ReturnType<typeof boundedIconSchema>>;
export type BoundedName = z.output<ReturnType<typeof boundedNameSchema>>;
