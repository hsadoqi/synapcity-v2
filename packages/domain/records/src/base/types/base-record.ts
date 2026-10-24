import type { z } from 'zod';

import type { baseRecordSchema } from '../schemas';

export type BaseRecord = z.infer<typeof baseRecordSchema>;
