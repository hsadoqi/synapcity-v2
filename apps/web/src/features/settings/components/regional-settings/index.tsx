'use client';

import { useEffect, useState } from 'react';
import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import { useSettingsDraft } from '../../hooks/use-settings-draft';
import {
  LanguageRow,
  TimezoneRow,
  TimeFormatRow,
  DateFormatRow,
  FirstDayOfWeekRow,
  NumberFormatRow,
} from './regional-rows';
import { RegionalPreview } from './regional-preview';
import { SettingsTabShell } from '../../shared/settings-tabs';
import {
  SettingsAccordion,
  SettingsAccordionItem,
} from '../../shared/settings-accordion';

export function RegionalSettings() {
  const draft = useSettingsDraft('regional');
  const regional = draft.draft;
  const updateRegional = draft.change;
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
      draft={draft}
      preview={{
        content: <RegionalPreview regional={regional} now={previewDate} />,
      }}
    >
      <SettingsAccordion>
        <SettingsAccordionItem value="language" title="Language">
          <FieldGroup>
            <LanguageRow
              value={regional.language}
              onChange={(language) => updateRegional({ language })}
            />
          </FieldGroup>
        </SettingsAccordionItem>
        <SettingsAccordionItem value="date-time" title="Date & time">
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
        </SettingsAccordionItem>
        <SettingsAccordionItem value="numbers" title="Numbers">
          <FieldGroup>
            <NumberFormatRow
              value={regional.numberFormat}
              onChange={(numberFormat) => updateRegional({ numberFormat })}
            />
          </FieldGroup>
        </SettingsAccordionItem>
      </SettingsAccordion>
    </SettingsTabShell>
  );
}
