import { addons, type API } from 'storybook/manager-api';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import {
  brandConfigs,
  buildTheme,
  lightPalette,
  darkPalette,
  baseTheme,
} from './theme';
import {
  isMode,
  isResolvedMode,
  resolveMode,
} from '@synapcity/frontend-preferences';
import type { ResolvedMode } from '@synapcity/frontend-preferences';
/** Reads a key without letting blocked or unavailable storage (private windows, sandboxed
 * iframes) throw; the manager must still come up with the default theme. */
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is only a first-paint hint; the toolbar remains the source of truth.
  }
}

function resolveSbTheme(modeOverride?: ResolvedMode) {
  const storedBrand = readStored('sb-brand');
  const storedMode = modeOverride ?? readStored('sb-mode');
  const brand =
    storedBrand !== null && Object.hasOwn(brandConfigs, storedBrand)
      ? storedBrand
      : 'synapcity';
  // Validate rather than assert: any other stored string falls back to dark.
  const mode: ResolvedMode =
    storedMode !== null && isResolvedMode(storedMode)
      ? storedMode
      : storedMode !== null && isMode(storedMode)
        ? resolveMode(storedMode)
        : 'dark';

  return buildTheme(
    brand,
    mode,
    brandConfigs,
    { light: lightPalette, dark: darkPalette },
    baseTheme,
  );
}

addons.setConfig({ theme: resolveSbTheme() });

/* The toolbar's theme switcher (addon-themes) owns the mode. It changes the preview on its own,
 * so mirror it here: the manager chrome follows the same global, live, and the choice is kept for
 * the next load's first paint. */
addons.register('synapcity/theme-sync', (api: API) => {
  const apply = (value: unknown) => {
    if (!isResolvedMode(typeof value === 'string' ? value : null)) return;
    const mode = value as ResolvedMode;
    writeStored('sb-mode', mode);
    api.setOptions({ theme: resolveSbTheme(mode) });
  };

  apply(api.getGlobals().theme);
  api.on(
    GLOBALS_UPDATED,
    ({ userGlobals }: { userGlobals?: { theme?: unknown } }) =>
      apply(userGlobals?.theme),
  );
});
