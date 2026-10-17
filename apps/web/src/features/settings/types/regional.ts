import { z } from 'zod';

export const regionalSchema = z.object({
  language: z.enum(['en', 'es', 'fr', 'de', 'zh', 'ja']).default('en'),
  timeFormat: z.enum(['12-hour', '24-hour']).default('12-hour'),
  dateFormat: z
    .enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
    .default('MM/DD/YYYY'),
  numberFormat: z
    .enum(['1,000.00', '1.000,00', '1 000,00'])
    .default('1,000.00'),
  timezone: z
    .string()
    .refine(
      (timezone) => {
        // Use the same timezone support as the runtime that formats dates.
        try {
          new Intl.DateTimeFormat('en', { timeZone: timezone });
          return true;
        } catch {
          return false;
        }
      },
      { error: 'Choose a valid timezone, such as UTC or America/New_York.' },
    )
    .default('UTC'),
  firstDayOfWeek: z.enum(['Sunday', 'Monday', 'Saturday']).default('Sunday'),
});

export type RegionalSettings = z.infer<typeof regionalSchema>;
export type RegionalSettingsPatch = Partial<RegionalSettings>;

export const regionalDefaults: RegionalSettings = regionalSchema.parse({});
