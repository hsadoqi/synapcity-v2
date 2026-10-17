import {
  appearanceDefaults,
  contrastModes,
  fontSizes,
  type AppearanceSettings,
} from '../../types/appearance';

/** Where the browser keeps every preference, appearance included. */
export const PREFERENCES_STORAGE_KEY = 'synapcity-preferences';

/**
 * Appearance preferences reach the page as data attributes on <html>, which
 * tokens/preferences.css in the tailwind-config package styles. Two writers
 * share this one mapping: the settings provider (live changes) and the boot
 * script below (first paint, on every page).
 */
export function applyAppearance(
  root: HTMLElement,
  appearance: Pick<
    AppearanceSettings,
    | 'animationsEnabled'
    | 'showBorders'
    | 'reducedMotion'
    | 'contrastMode'
    | 'fontSize'
  >,
) {
  root.dataset.animations = String(appearance.animationsEnabled);
  root.dataset.borders = String(appearance.showBorders);
  root.dataset.reducedMotion = String(appearance.reducedMotion);
  root.dataset.contrast = appearance.contrastMode;
  root.dataset.fontSize = appearance.fontSize;
}

/**
 * Runs before the first paint, from the root layout. The settings provider only
 * mounts on the settings page and only after hydration, so without this the
 * saved text size, contrast and motion choices would be missing on every other
 * page and flash in late on this one.
 *
 * It reads the raw saved JSON and accepts only values the schema allows, so
 * tampered storage can neither throw nor write an arbitrary attribute. The
 * allowed values and fallbacks come from the schema, not from a second list.
 */
export const appearanceBootScript = `(function(){var a={};try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFERENCES_STORAGE_KEY,
)})||'{}');if(s&&typeof s.appearance==='object'&&s.appearance)a=s.appearance}catch(x){}try{var D=${JSON.stringify(
  appearanceDefaults,
)};var O={contrastMode:${JSON.stringify(
  contrastModes,
)},fontSize:${JSON.stringify(
  fontSizes,
)}};function b(k){return typeof a[k]==='boolean'?a[k]:D[k]}function e(k){return O[k].indexOf(a[k])>-1?a[k]:D[k]}var d=document.documentElement.dataset;d.animations=String(b('animationsEnabled'));d.borders=String(b('showBorders'));d.reducedMotion=String(b('reducedMotion'));d.contrast=e('contrastMode');d.fontSize=e('fontSize')}catch(x){}})();`;
