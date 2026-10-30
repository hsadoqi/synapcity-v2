import { instantSchema } from '@synapcity/domain-time';
import { z } from 'zod';

import { RECORD_KINDS, RECORD_MESSAGES } from '../constants';
import { baseRecordFieldsSchema } from './base-field';

/** One of the persisted record kinds ({@link RECORD_KINDS}). */
export const recordKindSchema = z.enum(RECORD_KINDS);

/**
 * The id of a persisted record, wherever one arrives from outside the server
 * (a route, a Server Action argument) before it reaches a uuid column: the
 * database generates every record id as a uuid, and a malformed one cannot
 * match a row.
 */
export const recordIdSchema = z.uuid();

/**
 * The ten fields every owned record shares (ADR-0012, ADR-0013): the editable
 * fields plus the saved-record metadata the server supplies. Each kind extends
 * this and keeps its own contract and messages. This is the read contract, so
 * it carries no D5 limits (see {@link baseRecordFieldsSchema}).
 */
export const baseRecordSchema = baseRecordFieldsSchema.extend({
  // Opaque to this contract (a uuid in the database, a prefixed id in the
  // prototypes); bounded so a corrupt value cannot be huge.
  id: z.string().min(1, RECORD_MESSAGES.missingId).max(200),
  ownerId: z.uuid(),
  createdAt: instantSchema,
  updatedAt: instantSchema,
  /** When the owner pinned the record; null when it is not pinned. */
  pinnedAt: instantSchema.nullable().default(null),
  /** When the owner last opened the record; null when never opened. */
  lastViewedAt: instantSchema.nullable().default(null),
});
