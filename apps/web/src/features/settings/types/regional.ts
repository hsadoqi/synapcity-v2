import { z } from 'zod';

const languages = ['en', 'es', 'fr', 'de', 'zh', 'ja'] as const;

const numberFormats = [
  '1,000.00',
  '1.000,00',
  '1 000,00',
  "1'000.00",
  '1,00,000.00',
] as const;

const firstDaysOfWeek = ['sunday', 'monday', 'saturday'] as const;

/** Follow the device's timezone instead of a fixed one. */
export const SYSTEM_TIMEZONE = 'system';

function isSupportedTimezone(timezone: string) {
  // Use the same timezone support as the runtime that formats dates.
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export const regionalSchema = z.object({
  language: z.enum(languages).default('en'),
  timeFormat: z.enum(['12-hour', '24-hour']).default('12-hour'),
  dateFormat: z
    .enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
    .default('MM/DD/YYYY'),
  numberFormat: z.enum(numberFormats).default('1,000.00'),
  timezone: z
    .string()
    .refine(
      (timezone) =>
        timezone === SYSTEM_TIMEZONE || isSupportedTimezone(timezone),
      { error: 'Choose a valid timezone, such as UTC or America/New_York.' },
    )
    .default(SYSTEM_TIMEZONE),
  // Earlier versions saved capitalised days ("Monday"); read them as lower case.
  firstDayOfWeek: z
    .preprocess(
      (day) => (typeof day === 'string' ? day.toLowerCase() : day),
      z.enum(firstDaysOfWeek),
    )
    .default('sunday'),
});

export type RegionalSettings = z.infer<typeof regionalSchema>;
export type RegionalSettingsPatch = Partial<RegionalSettings>;

export const regionalDefaults: RegionalSettings = regionalSchema.parse({});

/** The IANA timezone to format with: the device's when the setting is `system`. */
export function resolveTimezone(timezone: RegionalSettings['timezone']) {
  return timezone === SYSTEM_TIMEZONE
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : timezone;
}
