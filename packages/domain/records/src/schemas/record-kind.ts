import { z } from 'zod';

import { RECORD_KINDS } from '../constants';

/** One of the persisted record kinds ({@link RECORD_KINDS}). */
export const recordKindSchema = z.enum(RECORD_KINDS);
