'use client';

import { FieldGroup } from '@synapcity/frontend-ui/components/ui/field';
import { Separator } from '@synapcity/frontend-ui/components/ui/separator';
import { useThemeSettings } from '../../hooks/use-theme-settings';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell/settings-tab-shell';
import { ThemeLivePreview } from './theme-live-preview/theme-live-preview';
import { ThemeDisclaimer } from './theme-disclaimer/theme-disclaimer';
import { ThemeModeRow } from './theme-rows/theme-rows';
import { BodyFontRow, CodeFontRow, HeadingFontRow } from './font-rows';

export function ThemeSettings() {
  const { theme, updateTheme } = useThemeSettings();
  return (
    <SettingsTabShell
      title="Theme"
      description="A familiar space, in the light that suits you."
    >
      <FieldGroup>
        <ThemeModeRow
          value={theme.mode}
          onChange={(mode) => updateTheme({ mode })}
        />
      </FieldGroup>
      <Separator />
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Fonts</h3>
        <FieldGroup>
          <HeadingFontRow
            value={theme.headingFont}
            onChange={(headingFont) => updateTheme({ headingFont })}
          />
          <BodyFontRow
            value={theme.bodyFont}
            onChange={(bodyFont) => updateTheme({ bodyFont })}
          />
          <CodeFontRow
            value={theme.codeFont}
            onChange={(codeFont) => updateTheme({ codeFont })}
          />
        </FieldGroup>
        <p className="text-xs text-muted-foreground">
          Fonts load from Google Fonts, and only once you choose them.
        </p>
      </section>
      <Separator />
      <ThemeLivePreview theme={{ mode: theme.mode }} />
      <ThemeDisclaimer theme={{ mode: theme.mode }} />
    </SettingsTabShell>
  );
}
