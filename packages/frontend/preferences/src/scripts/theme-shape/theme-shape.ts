import { lookSourceExpression } from '../look-source';
import type { CSSProperties } from 'react';
import { PREFERENCES_STORAGE_KEY } from '../appearance-attributes';
import {
  densities,
  legacyFontSizes,
  radii,
  textSizeRange,
  themeDefaults,
  type ThemeSettings,
} from '@synapcity/domain-preferences';

type ThemeShape = Pick<ThemeSettings, 'radius' | 'density' | 'textSize'>;

/** The `--text-scale` factor tokens/preferences.css multiplies the base text size by. */
const textScale = (textSize: number) => String(textSize / 100);

/**
 * Corner radius, density and text size reach the page as data attributes, which
 * tokens/preferences.css turns into `--radius-base`, `--spacing` and
 * `--text-base-size`. Text size is a percentage rather than a preset, so its
 * factor goes beside the attribute as `--text-scale`. Two writers share this one
 * mapping: the settings provider (live changes) and the boot script below (first
 * paint, on every page). It writes to any element, not only <html>: the Theme
 * tab's live preview sets the same values on its own frame, and the CSS selects
 * on the attribute alone, so the sample shows an unsaved choice without the page
 * changing.
 */
export function applyThemeShape(element: HTMLElement, theme: ThemeShape) {
  element.dataset.radius = theme.radius;
  element.dataset.density = theme.density;
  element.dataset.textSize = String(theme.textSize);
  element.style.setProperty('--text-scale', textScale(theme.textSize));
}

/**
 * The same attributes as props, for previewing a choice on one element in JSX
 * (the Theme tab's live preview), the way `previewFontStyle` previews fonts.
 * The text scale is a style, so it comes from `previewTextScaleStyle`.
 */
export function previewShapeAttributes(theme: ThemeShape) {
  return {
    'data-radius': theme.radius,
    'data-density': theme.density,
    'data-text-size': String(theme.textSize),
  };
}

export function previewTextScaleStyle(
  theme: Pick<ThemeSettings, 'textSize'>,
): CSSProperties {
  return { '--text-scale': textScale(theme.textSize) } as CSSProperties;
}

/**
 * Runs before the first paint, from the root layout. The settings provider only
 * mounts on the settings page and only after hydration, so without this the saved
 * shape would be missing on every other page and snap in late on this one. It
 * reads the raw saved JSON and accepts only the values the schema allows, so
 * tampered storage can neither throw nor write an arbitrary attribute. The allowed
 * values and fallbacks come from the schema, not from a second list. Settings saved
 * before text size was a percentage hold `appearance.fontSize` instead, read
 * through the same legacy map as the importer until the settings are next saved.
 */
export const themeShapeBootScript = `(function(){try{var t={},a={};try{var s=${lookSourceExpression(PREFERENCES_STORAGE_KEY)};if(s&&typeof s.theme==='object'&&s.theme)t=s.theme;if(s&&typeof s.appearance==='object'&&s.appearance)a=s.appearance}catch(x){}var O=${JSON.stringify(
  { radius: radii, density: densities },
)};var D=${JSON.stringify({
  radius: themeDefaults.radius,
  density: themeDefaults.density,
  textSize: themeDefaults.textSize,
})};var R=${JSON.stringify(textSizeRange)};var L=${JSON.stringify(
  legacyFontSizes,
)};function e(k){return O[k].indexOf(t[k])>-1?t[k]:D[k]}function z(n){return typeof n==='number'&&n%1===0&&n>=R.min&&n<=R.max&&n%R.step===0}var n=z(t.textSize)?t.textSize:Object.prototype.hasOwnProperty.call(L,a.fontSize)?L[a.fontSize]:D.textSize;var r=document.documentElement;var d=r.dataset;d.radius=e('radius');d.density=e('density');d.textSize=String(n);r.style.setProperty('--text-scale',String(n/100))}catch(x){}})();`;
