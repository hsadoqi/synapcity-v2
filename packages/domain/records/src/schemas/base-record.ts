import { instantSchema } from '@synapcity/domain-time';
import { z } from 'zod';

import { RECORD_MESSAGES } from '../constants';
import { baseRecordMetadataSchema } from './base-field';

/**
 * The ten fields every owned record shares (ADR-0012, ADR-0013): the editable
 * fields plus the saved-record metadata the server supplies. Each kind extends
 * this and keeps its own contract and messages. The id stays opaque here:
 * concrete persistence adapters validate their own durable identifier format.
 */
export const baseRecordSchema = baseRecordMetadataSchema.extend({
  id: z.string().min(1, RECORD_MESSAGES.missingId),
  ownerId: z.uuid(),
  createdAt: instantSchema,
  updatedAt: instantSchema,
  /** When the owner pinned the record; null when it is not pinned. */
  pinnedAt: instantSchema.nullable().default(null),
  /** When the owner last opened the record; null when never opened. */
  lastViewedAt: instantSchema.nullable().default(null),
});
