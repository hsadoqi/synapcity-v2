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
} from '../schemas';

export type BaseRecord = z.infer<typeof baseRecordSchema>;

export type BaseRecordMetadata = z.infer<typeof baseRecordMetadataSchema>;
export type BaseRecordCreate = z.infer<typeof baseRecordCreateSchema>;
export type BaseRecordPatch = z.infer<typeof baseRecordPatchSchema>;

export type BoundedDescription = z.output<typeof boundedDescriptionSchema>;
export type BoundedIcon = z.output<ReturnType<typeof boundedIconSchema>>;
export type BoundedName = z.output<ReturnType<typeof boundedNameSchema>>;
export type BoundedTags = z.output<typeof boundedTagsSchema>;
