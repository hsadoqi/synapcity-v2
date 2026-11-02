import type { z } from 'zod';

import type {
  calendarDateSchema,
  durationSchema,
  instantSchema,
  timeOfDaySchema,
} from '../schemas';

export type Instant = z.infer<typeof instantSchema>;
export type CalendarDate = z.infer<typeof calendarDateSchema>;
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
export type Duration = z.infer<typeof durationSchema>;
