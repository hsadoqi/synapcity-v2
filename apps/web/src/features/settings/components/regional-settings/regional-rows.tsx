'use client';

import { SettingRow } from '../../shared/setting-row/setting-row';
import { SettingsCombobox } from '../../shared/settings-combobox/settings-combobox';
import { SettingsSelect } from '../../shared/settings-select/settings-select';
import {
  resolveTimezone,
  SYSTEM_TIMEZONE,
  type RegionalSettings,
} from '../../types/regional';

type RowProps<Key extends keyof RegionalSettings> = {
  value: RegionalSettings[Key];
  onChange: (value: RegionalSettings[Key]) => void;
};

// Each language in its own name, then in English for anyone who cannot read it.
// No flags: a language is not a country.
const languageOptions: {
  value: RegionalSettings['language'];
  label: string;
}[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español — Spanish' },
  { value: 'fr', label: 'Français — French' },
  { value: 'de', label: 'Deutsch — German' },
  { value: 'zh', label: '中文 — Chinese' },
  { value: 'ja', label: '日本語 — Japanese' },
];

export function LanguageRow({ value, onChange }: RowProps<'language'>) {
  return (
    <SettingRow
      id="language"
      label="Preferred language"
      description="Your preferred language for your workspace."
    >
      <SettingsSelect<RegionalSettings['language']>
        id="language"
        value={value}
        onChange={onChange}
        options={languageOptions}
      />
    </SettingRow>
  );
}

export function TimezoneRow({
  value,
  onChange,
  timezones,
  deviceTimezone,
}: RowProps<'timezone'> & {
  timezones: readonly string[];
  /** Known only in the browser; null during the server render. */
  deviceTimezone: string | null;
}) {
  const device = {
    value: SYSTEM_TIMEZONE,
    label: deviceTimezone
      ? `Device (${deviceTimezone.replaceAll('_', ' ')})`
      : 'Device timezone',
  };
  // Preserve valid saved aliases or offsets absent from the canonical zone list.
  const zones = [...new Set(['UTC', value, ...timezones])]
    .filter((timezone) => timezone !== SYSTEM_TIMEZONE)
    .map((timezone) => ({
      value: timezone,
      label: timezone.replaceAll('_', ' '),
    }));
  return (
    <SettingRow
      id="timezone"
      label="Timezone"
      description="Use this timezone when displaying dates and times."
    >
      <SettingsCombobox
        id="timezone"
        value={value}
        onChange={onChange}
        options={[device, ...zones]}
        placeholder="Search timezones…"
        empty="No timezone matches."
      />
    </SettingRow>
  );
}

export function TimeFormatRow({
  value,
  onChange,
  timezone,
  language,
  previewDate,
}: RowProps<'timeFormat'> & {
  timezone: RegionalSettings['timezone'];
  language: RegionalSettings['language'];
  previewDate: Date | null;
}) {
  const preview = previewDate
    ? new Intl.DateTimeFormat(language, {
        timeZone: resolveTimezone(timezone),
        hour: 'numeric',
        minute: '2-digit',
        hourCycle: value === '12-hour' ? 'h12' : 'h23',
      }).format(previewDate)
    : '…';
  return (
    <SettingRow
      id="time"
      label="Time format"
      description={`Current time looks like: ${preview}`}
    >
      <SettingsSelect<RegionalSettings['timeFormat']>
        id="time"
        value={value}
        onChange={onChange}
        options={[
          { value: '12-hour', label: '12-hour' },
          { value: '24-hour', label: '24-hour' },
        ]}
      />
    </SettingRow>
  );
}

export function DateFormatRow({
  value,
  onChange,
  timezone,
  previewDate,
}: RowProps<'dateFormat'> & {
  timezone: RegionalSettings['timezone'];
  previewDate: Date | null;
}) {
  const parts = previewDate
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: resolveTimezone(timezone),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(previewDate)
    : [];
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  const year = parts.find((part) => part.type === 'year')?.value;
  const preview = !previewDate
    ? '…'
    : value === 'MM/DD/YYYY'
      ? `${month}/${day}/${year}`
      : value === 'DD/MM/YYYY'
        ? `${day}/${month}/${year}`
        : `${year}-${month}-${day}`;
  return (
    <SettingRow
      id="date"
      label="Date format"
      description={`Today looks like: ${preview}`}
    >
      <SettingsSelect<RegionalSettings['dateFormat']>
        id="date"
        value={value}
        onChange={onChange}
        options={[
          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
        ]}
      />
    </SettingRow>
  );
}

export function FirstDayOfWeekRow({
  value,
  onChange,
}: RowProps<'firstDayOfWeek'>) {
  return (
    <SettingRow
      id="first-day-of-week"
      label="First day of the week"
      description="Your preferred starting day for calendar weeks."
    >
      <SettingsSelect<RegionalSettings['firstDayOfWeek']>
        id="first-day-of-week"
        value={value}
        onChange={onChange}
        options={[
          { value: 'sunday', label: 'Sunday' },
          { value: 'monday', label: 'Monday' },
          { value: 'saturday', label: 'Saturday' },
        ]}
      />
    </SettingRow>
  );
}

// `grouping` picks the digit grouping: en-IN groups by lakh and crore (12,34,567).
const numberFormatParts: Record<
  RegionalSettings['numberFormat'],
  { group: string; decimal: string; grouping: 'en-US' | 'en-IN' }
> = {
  '1,000.00': { group: ',', decimal: '.', grouping: 'en-US' },
  '1.000,00': { group: '.', decimal: ',', grouping: 'en-US' },
  '1 000,00': { group: ' ', decimal: ',', grouping: 'en-US' },
  "1'000.00": { group: "'", decimal: '.', grouping: 'en-US' },
  '1,00,000.00': { group: ',', decimal: '.', grouping: 'en-IN' },
};

export function NumberFormatRow({ value, onChange }: RowProps<'numberFormat'>) {
  const { group, decimal, grouping } = numberFormatParts[value];
  const preview = new Intl.NumberFormat(grouping, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .formatToParts(1234567.89)
    .map((part) => {
      if (part.type === 'group') return group;
      if (part.type === 'decimal') return decimal;
      return part.value;
    })
    .join('');
  return (
    <SettingRow
      id="number-format"
      label="Number format"
      description={`An example number looks like: ${preview}`}
    >
      <SettingsSelect<RegionalSettings['numberFormat']>
        id="number-format"
        value={value}
        onChange={onChange}
        options={Object.keys(numberFormatParts).map((format) => ({
          value: format as RegionalSettings['numberFormat'],
          label: format,
        }))}
      />
    </SettingRow>
  );
}
