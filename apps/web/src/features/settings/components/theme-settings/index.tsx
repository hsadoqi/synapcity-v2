'use client';

import { useState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import { Separator } from '@synapcity/frontend-ui/core/separator';
import { cn } from '@/lib/utils';
import { useThemeDraft } from '../../hooks/use-theme-draft';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell/settings-tab-shell';
import { SettingsSection } from '../../shared/settings-section';
import { ThemeLivePreview } from './theme-live-preview/theme-live-preview';
import { ThemeModeRow } from './theme-rows/theme-rows';
import { BodyFontRow, CodeFontRow, HeadingFontRow } from './font-rows';

/**
 * Choices here are a draft: the previews show them at once, and the workspace
 * switches only when they are saved.
 */
export function ThemeSettings() {
  const { draft, change, save, discard, hasChanges } = useThemeDraft();
  // "Saved." confirms the last save until the next choice is made.
  const [saved, setSaved] = useState(false);
  const edit: typeof change = (patch) => {
    setSaved(false);
    change(patch);
  };
  return (
    <SettingsTabShell
      title="Theme"
      description="Choose the light and the type you work best in."
    >
      <FieldGroup>
        <ThemeModeRow value={draft.mode} onChange={(mode) => edit({ mode })} />
      </FieldGroup>
      <Separator />
      <SettingsSection title="Fonts">
        {/* Wider than the gap inside a row, so each sample reads as part of the
            choice above it rather than the next one. */}
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
      <Separator />
      <ThemeLivePreview theme={draft} />
      {/* The actions sit at the end of a long tab. Once there is something to
          save they lift into a bar fixed to the bottom of the viewport, so the
          prompt to save stays in view wherever the change was made. Fixed, not
          sticky: the settings page nests several scroll containers, and fixed
          does not depend on which of them scrolls. The outer box keeps the bar's
          place, tall enough while it floats that the end of the tab is never
          hidden under it. */}
      <div
        className={cn(
          'flex min-h-7 justify-end pointer-coarse:min-h-11',
          hasChanges && 'min-h-16 pointer-coarse:min-h-20',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-end gap-3',
            hasChanges &&
              'fixed inset-x-4 bottom-safe-4 z-10 mx-auto max-w-md justify-between rounded-lg border border-border bg-popover p-2 ps-4 text-popover-foreground shadow-md animate-in fade-in-0 slide-in-from-bottom-2',
          )}
        >
          <p role="status" className="text-xs text-muted-foreground">
            {hasChanges ? 'You have unsaved changes.' : saved ? 'Saved.' : ''}
          </p>
          <div className="flex items-center gap-3">
            {/* Each button disables itself when used. Focusable while disabled,
                so keyboard focus stays on it instead of falling back to the page. */}
            <Button
              type="button"
              variant="outline"
              disabled={!hasChanges}
              focusableWhenDisabled
              onClick={discard}
            >
              Discard
            </Button>
            <Button
              type="button"
              disabled={!hasChanges}
              focusableWhenDisabled
              onClick={() => {
                save();
                setSaved(true);
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </SettingsTabShell>
  );
}
