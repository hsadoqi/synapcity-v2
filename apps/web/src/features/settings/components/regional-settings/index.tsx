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
import { SettingsSection } from '../../shared/settings-section';

export function RegionalSettings() {
  const { regional, updateRegional } = useRegionalSettings();
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [deviceTimezone, setDeviceTimezone] = useState<string | null>(null);

  useEffect(() => {
    // Keep the initial server/client render identical; populate browser data later.
    const initial = setTimeout(() => {
      setPreviewDate(new Date());
      setTimezones(Intl.supportedValuesOf('timeZone'));
      setDeviceTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, 0);
    // Tick on the minute, not a minute after opening, so the time preview
    // never shows the minute that has already passed.
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      timer = setTimeout(
        () => {
          setPreviewDate(new Date());
          tick();
        },
        60000 - (Date.now() % 60000),
      );
    };
    tick();
    return () => {
      clearTimeout(initial);
      clearTimeout(timer);
    };
  }, []);

  return (
    <SettingsTabShell
      title="Regional"
      description="How you see dates, times, and numbers."
    >
      <SettingsSection title="Language">
        <FieldGroup>
          <LanguageRow
            value={regional.language}
            onChange={(language) => updateRegional({ language })}
          />
        </FieldGroup>
      </SettingsSection>
      <Separator />
      <SettingsSection title="Date & time">
        <FieldGroup>
          <TimezoneRow
            value={regional.timezone}
            onChange={(timezone) => updateRegional({ timezone })}
            timezones={timezones}
            deviceTimezone={deviceTimezone}
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
      </SettingsSection>
      <Separator />
      <SettingsSection title="Numbers">
        <FieldGroup>
          <NumberFormatRow
            value={regional.numberFormat}
            onChange={(numberFormat) => updateRegional({ numberFormat })}
          />
        </FieldGroup>
      </SettingsSection>
    </SettingsTabShell>
  );
}
