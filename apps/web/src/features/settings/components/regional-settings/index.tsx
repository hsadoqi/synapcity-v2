'use client';

import { useEffect, useState } from 'react';
import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import { Separator } from '@synapcity/frontend-ui/core/separator';
import { useRegionalSettings } from '../../hooks/use-regional-settings';
import {
  LanguageRow,
  TimezoneRow,
  TimeFormatRow,
  DateFormatRow,
  FirstDayOfWeekRow,
  NumberFormatRow,
} from './regional-rows';
import { SettingsTabShell } from '../../shared/settings-tabs';

export function RegionalSettings() {
  const { regional, updateRegional } = useRegionalSettings();
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [timezones, setTimezones] = useState<string[]>([]);

  useEffect(() => {
    // Keep the initial server/client render identical; populate browser data later.
    const initial = setTimeout(() => {
      setPreviewDate(new Date());
      setTimezones(Intl.supportedValuesOf('timeZone'));
    }, 0);
    const timer = setInterval(() => setPreviewDate(new Date()), 60000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  return (
    <SettingsTabShell
      title="Regional"
      description="How you see dates, times, and numbers."
    >
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Language</h3>
        <FieldGroup>
          <LanguageRow
            value={regional.language}
            onChange={(language) => updateRegional({ language })}
          />
        </FieldGroup>
      </section>
      <Separator />
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Date &amp; time</h3>
        <FieldGroup>
          <TimezoneRow
            value={regional.timezone}
            onChange={(timezone) => updateRegional({ timezone })}
            timezones={timezones}
          />
          <TimeFormatRow
            value={regional.timeFormat}
            onChange={(timeFormat) => updateRegional({ timeFormat })}
            timezone={regional.timezone}
            language={regional.language}
            previewDate={previewDate}
          />
          <DateFormatRow
            value={regional.dateFormat}
            onChange={(dateFormat) => updateRegional({ dateFormat })}
            timezone={regional.timezone}
            previewDate={previewDate}
          />
          <FirstDayOfWeekRow
            value={regional.firstDayOfWeek}
            onChange={(firstDayOfWeek) => updateRegional({ firstDayOfWeek })}
          />
        </FieldGroup>
      </section>
      <Separator />
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Numbers</h3>
        <FieldGroup>
          <NumberFormatRow
            value={regional.numberFormat}
            onChange={(numberFormat) => updateRegional({ numberFormat })}
          />
        </FieldGroup>
      </section>
    </SettingsTabShell>
  );
}
