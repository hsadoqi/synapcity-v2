'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import { Separator } from '@synapcity/frontend-ui/core/separator';
import { useAppearanceSettings } from '../../hooks/use-appearance-settings';
import { useSettings } from '../../hooks/use-settings';
import { SettingsSection, SettingsTabShell } from '../../shared';
import {
  AllDevicesRow,
  ContrastModeRow,
  EnableAnimationsRow,
  FontSizeRow,
  ReducedMotionRow,
  ShowBordersRow,
} from './appearance-rows';

// `appearance.colorScheme` is not shown: it mirrors the Color theme chosen in
// the Theme tab, which owns it.
export function AppearanceSettings() {
  const { appearance, updateAppearance } = useAppearanceSettings();
  const { syncsToAccount, displayOnAllDevices, setDisplayOnAllDevices } =
    useSettings();

  return (
    <SettingsTabShell
      title="Display"
      description="Text size, contrast and motion across the app."
    >
      <SettingsSection title="Readability">
        <FieldGroup>
          <FontSizeRow
            value={appearance.fontSize}
            onChange={(fontSize) => updateAppearance({ fontSize })}
          />
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
      </SettingsSection>
      <Separator />
      <SettingsSection title="Motion">
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
      </SettingsSection>
      {syncsToAccount && (
        <>
          <Separator />
          <SettingsSection title="Devices">
            <FieldGroup>
              <AllDevicesRow
                value={displayOnAllDevices}
                onChange={setDisplayOnAllDevices}
              />
            </FieldGroup>
          </SettingsSection>
        </>
      )}
    </SettingsTabShell>
  );
}
