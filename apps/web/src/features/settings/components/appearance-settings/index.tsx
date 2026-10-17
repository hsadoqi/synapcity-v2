'use client';

import { FieldGroup } from '@synapcity/frontend-ui/components/ui/field';
import { Separator } from '@synapcity/frontend-ui/components/ui/separator';
import { useAppearanceSettings } from '../../hooks/use-appearance-settings';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell/settings-tab-shell';
import {
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

  return (
    <SettingsTabShell
      title="Display"
      description="The small details that make this space yours."
    >
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Readability</h3>
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
            value={appearance.showBorders}
            onChange={(showBorders) => updateAppearance({ showBorders })}
          />
        </FieldGroup>
      </section>
      <Separator />
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Motion</h3>
        <FieldGroup>
          <EnableAnimationsRow
            value={appearance.animationsEnabled}
            onChange={(animationsEnabled) =>
              updateAppearance({ animationsEnabled })
            }
          />
          <ReducedMotionRow
            value={appearance.reducedMotion}
            onChange={(reducedMotion) => updateAppearance({ reducedMotion })}
          />
        </FieldGroup>
      </section>
    </SettingsTabShell>
  );
}
