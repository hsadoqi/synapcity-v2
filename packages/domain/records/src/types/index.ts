import type { z } from 'zod';

import type {
  baseRecordCreateSchema,
  baseRecordMetadataSchema,
  baseRecordPatchSchema,
  baseRecordSchema,
  boundedDescriptionSchema,
  boundedIconSchema,
  boundedNameSchema,
  boundedTagsSchema,
  recordKindSchema,
} from '../schemas';

export type BaseRecord = z.infer<typeof baseRecordSchema>;

/** One of the persisted record kinds: `space`, `document` or `dashboard`. */
export type RecordKind = z.infer<typeof recordKindSchema>;

export type BaseRecordMetadata = z.infer<typeof baseRecordMetadataSchema>;
export type BaseRecordCreate = z.infer<typeof baseRecordCreateSchema>;
export type BaseRecordPatch = z.infer<typeof baseRecordPatchSchema>;

export type BoundedDescription = z.output<typeof boundedDescriptionSchema>;
export type BoundedIcon = z.output<ReturnType<typeof boundedIconSchema>>;
export type BoundedName = z.output<ReturnType<typeof boundedNameSchema>>;
export type BoundedTags = z.output<typeof boundedTagsSchema>;
