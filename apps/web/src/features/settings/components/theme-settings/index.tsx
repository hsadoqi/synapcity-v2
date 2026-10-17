'use client';

import { Button } from '@synapcity/frontend-ui/core/button';
import { FieldGroup } from '@synapcity/frontend-ui/components/ui/field';
import { Separator } from '@synapcity/frontend-ui/components/ui/separator';
import { useThemeDraft } from '../../hooks/use-theme-draft';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell/settings-tab-shell';
import { ThemeLivePreview } from './theme-live-preview/theme-live-preview';
import { ThemeDisclaimer } from './theme-disclaimer/theme-disclaimer';
import { ThemeModeRow } from './theme-rows/theme-rows';
import { BodyFontRow, CodeFontRow, HeadingFontRow } from './font-rows';

/**
 * Choices here are a draft: the previews show them at once, and the workspace
 * switches only when they are saved.
 */
export function ThemeSettings() {
  const { draft, change, save, hasChanges } = useThemeDraft();
  return (
    <SettingsTabShell
      title="Theme"
      description="Choose the light and the type you work best in."
    >
      <FieldGroup>
        <ThemeModeRow
          value={draft.mode}
          onChange={(mode) => change({ mode })}
        />
      </FieldGroup>
      <Separator />
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Fonts</h3>
        {/* Wider than the gap inside a row, so each sample reads as part of the
            choice above it rather than the next one. */}
        <FieldGroup className="gap-8">
          <HeadingFontRow
            value={draft.headingFont}
            onChange={(headingFont) => change({ headingFont })}
          />
          <BodyFontRow
            value={draft.bodyFont}
            onChange={(bodyFont) => change({ bodyFont })}
          />
          <CodeFontRow
            value={draft.codeFont}
            onChange={(codeFont) => change({ codeFont })}
          />
        </FieldGroup>
        <p className="text-xs text-muted-foreground">
          Fonts load from Google Fonts, and only once you choose them.
        </p>
      </section>
      <Separator />
      <ThemeLivePreview theme={draft} />
      <ThemeDisclaimer theme={{ mode: draft.mode }} />
      <div className="flex items-center justify-end gap-3">
        <p role="status" className="text-xs text-muted-foreground">
          {hasChanges ? 'You have unsaved changes.' : ''}
        </p>
        <Button type="button" disabled={!hasChanges} onClick={save}>
          Save changes
        </Button>
      </div>
    </SettingsTabShell>
  );
}
