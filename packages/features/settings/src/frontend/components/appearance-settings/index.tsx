'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import { useSettingsDraft } from '../../hooks/use-settings-draft';
import { useSettings } from '../../hooks/use-settings';
import {
  SettingsAccordion,
  SettingsAccordionItem,
} from '../../shared/settings-accordion';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell';
import {
  AllDevicesRow,
  ContrastModeRow,
  EnableAnimationsRow,
  ReducedMotionRow,
  ShowBordersRow,
} from './appearance-rows';

// `appearance.colorScheme` is not shown: it mirrors the Color theme chosen in
// the Theme tab, which owns it. Text size is chosen there too. Reset covers
// only what this tab shows.
const displayFields = [
  'contrastMode',
  'showBorders',
  'animationsEnabled',
  'reducedMotion',
] as const;

export function AppearanceSettings() {
  const draft = useSettingsDraft('appearance', { fields: displayFields });
  const appearance = draft.draft;
  const updateAppearance = draft.change;
  const { syncsToAccount, displayOnAllDevices, setDisplayOnAllDevices } =
    useSettings();

  return (
    <SettingsTabShell
      title="Display"
      description="Contrast and motion across the app."
      draft={draft}
    >
      <SettingsAccordion>
        <SettingsAccordionItem value="readability" title="Readability">
          <FieldGroup>
            <ContrastModeRow
              value={appearance.contrastMode}
              onChange={(contrastMode) => updateAppearance({ contrastMode })}
            />
            <ShowBordersRow
              highContrast={appearance.contrastMode === 'high'}
              value={appearance.showBorders}
              onChange={(showBorders) => updateAppearance({ showBorders })}
            />
          </FieldGroup>
        </SettingsAccordionItem>
        <SettingsAccordionItem value="motion" title="Motion">
          <FieldGroup>
            <EnableAnimationsRow
              value={appearance.animationsEnabled}
              onChange={(animationsEnabled) =>
                updateAppearance({ animationsEnabled })
              }
            />
            <ReducedMotionRow
              animationsOff={!appearance.animationsEnabled}
              value={appearance.reducedMotion}
              onChange={(reducedMotion) => updateAppearance({ reducedMotion })}
            />
          </FieldGroup>
        </SettingsAccordionItem>
        {syncsToAccount && (
          <SettingsAccordionItem value="devices" title="Devices">
            <FieldGroup>
              <AllDevicesRow
                value={displayOnAllDevices}
                onChange={setDisplayOnAllDevices}
              />
            </FieldGroup>
          </SettingsAccordionItem>
        )}
      </SettingsAccordion>
    </SettingsTabShell>
  );
}
