'use client';

import { SettingRow } from '../../shared/setting-row/setting-row';
import { SettingsSelect } from '../../shared/settings-select/settings-select';
import type { RegionalSettings } from '../../types/regional';

type RowProps<Key extends keyof RegionalSettings> = {
  value: RegionalSettings[Key];
  onChange: (value: RegionalSettings[Key]) => void;
};

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
        options={[
          { value: 'en', label: '🇺🇸 English' },
          { value: 'es', label: '🇪🇸 Español' },
          { value: 'fr', label: '🇫🇷 Français' },
          { value: 'de', label: '🇩🇪 Deutsch' },
          { value: 'zh', label: '🇨🇳 中文' },
          { value: 'ja', label: '🇯🇵 日本語' },
        ]}
      />
    </SettingRow>
  );
}

export function TimezoneRow({
  value,
  onChange,
  timezones,
}: RowProps<'timezone'> & { timezones: readonly string[] }) {
  // Preserve valid saved aliases or offsets absent from the canonical zone list.
  const options = [...new Set(['UTC', value, ...timezones])].map(
    (timezone) => ({
      value: timezone,
      label: timezone.replaceAll('_', ' '),
    }),
  );
  return (
    <SettingRow
      id="timezone"
      label="Timezone"
      description="Use this timezone when displaying dates and times."
    >
      <SettingsSelect
        id="timezone"
        value={value}
        onChange={onChange}
        options={options}
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
        timeZone: timezone,
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
        timeZone: timezone,
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
          { value: 'Sunday', label: 'Sunday' },
          { value: 'Monday', label: 'Monday' },
          { value: 'Saturday', label: 'Saturday' },
        ]}
      />
    </SettingRow>
  );
}

export function NumberFormatRow({ value, onChange }: RowProps<'numberFormat'>) {
  const separators = {
    '1,000.00': { group: ',', decimal: '.' },
    '1.000,00': { group: '.', decimal: ',' },
    '1 000,00': { group: ' ', decimal: ',' },
  }[value];
  const preview = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .formatToParts(1234567.89)
    .map((part) => {
      if (part.type === 'group') return separators.group;
      if (part.type === 'decimal') return separators.decimal;
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
        options={[
          { value: '1,000.00', label: '1,000.00' },
          { value: '1.000,00', label: '1.000,00' },
          { value: '1 000,00', label: '1 000,00' },
        ]}
      />
    </SettingRow>
  );
}
