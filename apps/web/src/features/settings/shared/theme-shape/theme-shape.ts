import { PREFERENCES_STORAGE_KEY } from '../appearance-attributes';
import {
  densities,
  radii,
  themeDefaults,
  type ThemeSettings,
} from '../../types/theme';

/**
 * Corner radius and density reach the page as data attributes, which
 * tokens/preferences.css turns into `--radius-base` and `--spacing`. Two writers
 * share this one mapping: the settings provider (live changes) and the boot
 * script below (first paint, on every page). It writes to any element, not only
 * <html>: the Theme tab's live preview sets the same attributes on its own frame,
 * and the CSS selects on the attribute alone, so the sample shows an unsaved choice
 * without the page changing.
 */
export function applyThemeShape(
  element: HTMLElement,
  theme: Pick<ThemeSettings, 'radius' | 'density'>,
) {
  element.dataset.radius = theme.radius;
  element.dataset.density = theme.density;
}

/**
 * The same two attributes as props, for previewing a choice on one element in JSX
 * (the Theme tab's live preview), the way `previewFontStyle` previews fonts.
 */
export function previewShapeAttributes(
  theme: Pick<ThemeSettings, 'radius' | 'density'>,
) {
  return { 'data-radius': theme.radius, 'data-density': theme.density };
}

/**
 * Runs before the first paint, from the root layout. The settings provider only
 * mounts on the settings page and only after hydration, so without this the saved
 * shape would be missing on every other page and snap in late on this one. It
 * reads the raw saved JSON and accepts only the presets the schema allows, so
 * tampered storage can neither throw nor write an arbitrary attribute. The allowed
 * values and fallbacks come from the schema, not from a second list.
 */
export const themeShapeBootScript = `(function(){try{var t={};try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFERENCES_STORAGE_KEY,
)})||'{}');if(s&&typeof s.theme==='object'&&s.theme)t=s.theme}catch(x){}var O=${JSON.stringify(
  { radius: radii, density: densities },
)};var D=${JSON.stringify({
  radius: themeDefaults.radius,
  density: themeDefaults.density,
})};function e(k){return O[k].indexOf(t[k])>-1?t[k]:D[k]}var d=document.documentElement.dataset;d.radius=e('radius');d.density=e('density')}catch(x){}})();`;
