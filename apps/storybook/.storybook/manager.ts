import { addons } from 'storybook/manager-api';
import {
  brandConfigs,
  buildTheme,
  lightPalette,
  darkPalette,
  baseTheme,
  type ThemeMode,
} from './theme';

/** Reads a key without letting blocked or unavailable storage (private windows, sandboxed
 * iframes) throw; the manager must still come up with the default theme. */
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function resolveSbTheme() {
  const storedBrand = readStored('sb-brand');
  const storedMode = readStored('sb-mode');
  const brand =
    storedBrand !== null && Object.hasOwn(brandConfigs, storedBrand)
      ? storedBrand
      : 'synapcity';
  // Validate rather than assert: any other stored string falls back to dark.
  const mode: ThemeMode = isThemeMode(storedMode) ? storedMode : 'dark';

  return buildTheme(
    brand,
    mode,
    brandConfigs,
    { light: lightPalette, dark: darkPalette },
    baseTheme,
  );
}

addons.setConfig({ theme: resolveSbTheme() });
