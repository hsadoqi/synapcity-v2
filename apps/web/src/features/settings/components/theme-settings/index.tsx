'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import { useThemeDraft } from '../../hooks/use-theme-draft';
import { SettingsTabShell } from '../../shared/settings-tabs';
import {
  SettingsAccordion,
  SettingsAccordionItem,
} from '../../shared/settings-accordion';
import { SettingsSection } from '../../shared/settings-section';
import { ThemePreviewPopover } from './theme-preview-popover';
import { ThemeLivePreview } from './theme-live-preview';
import { useWideLayout } from '../../hooks/use-settings-layout';
import {
  DensityRow,
  RadiusRow,
  TextSizeRow,
  ThemeModeRow,
} from './theme-rows/theme-rows';
import { BodyFontRow, CodeFontRow, HeadingFontRow } from './font-rows';

/**
 * Choices here are a draft: the previews show them at once, and the workspace
 * switches only when they are saved.
 */
export function ThemeSettings() {
  const theme = useThemeDraft();
  const { draft, change: edit, hasChanges } = theme;
  // Beside the settings where there is room; one press away otherwise.
  const wide = useWideLayout();
  return (
    <SettingsTabShell
      title="Theme"
      description="Choose the light and the type you work best in."
      action={
        wide ? undefined : (
          <ThemePreviewPopover theme={draft} hasChanges={hasChanges} />
        )
      }
      preview={{
        content: <ThemeLivePreview theme={draft} />,
        inline: false,
        wide: true,
      }}
      draft={theme}
    >
      <SettingsAccordion>
        <SettingsAccordionItem value="colors" title="Colors">
          <FieldGroup>
            <ThemeModeRow
              value={draft.mode}
              onChange={(mode) => edit({ mode })}
            />
          </FieldGroup>
        </SettingsAccordionItem>
        <SettingsAccordionItem value="typography" title="Typography">
          <SettingsSection title="Fonts" level={4}>
            {/* Wider than the gap inside a row, so each sample reads as part of
                the choice above it rather than the next one. */}
            <FieldGroup className="gap-8">
              <HeadingFontRow
                value={draft.headingFont}
                onChange={(headingFont) => edit({ headingFont })}
              />
              <BodyFontRow
                value={draft.bodyFont}
                onChange={(bodyFont) => edit({ bodyFont })}
              />
              <CodeFontRow
                value={draft.codeFont}
                onChange={(codeFont) => edit({ codeFont })}
              />
            </FieldGroup>
            <p className="text-xs text-muted-foreground">
              Fonts load from Google Fonts, and only once you choose them.
            </p>
          </SettingsSection>
          <SettingsSection title="Size" level={4}>
            <FieldGroup>
              <TextSizeRow
                value={draft.textSize}
                onChange={(textSize) => edit({ textSize })}
              />
            </FieldGroup>
          </SettingsSection>
        </SettingsAccordionItem>
        <SettingsAccordionItem value="shape" title="Shape and spacing">
          <FieldGroup>
            <RadiusRow
              value={draft.radius}
              onChange={(radius) => edit({ radius })}
            />
            <DensityRow
              value={draft.density}
              onChange={(density) => edit({ density })}
            />
          </FieldGroup>
        </SettingsAccordionItem>
      </SettingsAccordion>
    </SettingsTabShell>
  );
}
