import { useEffect } from 'react';

import {
  fontPreferenceVariables,
  fontStack,
  fontStylesheetUrl,
  googleFonts,
  type FontChoice,
  type FontRole,
  type GoogleFontId,
} from '../../types/fonts';
import type { ThemeSettings } from '../../types/theme';
import { PREFERENCES_STORAGE_KEY } from '../appearance-attributes';

const GOOGLE_STYLES = 'https://fonts.googleapis.com';
const GOOGLE_FILES = 'https://fonts.gstatic.com';

type FontFields = Pick<ThemeSettings, 'headingFont' | 'bodyFont' | 'codeFont'>;

const roleFields: Record<FontRole, keyof FontFields> = {
  heading: 'headingFont',
  body: 'bodyFont',
  code: 'codeFont',
};

/** One id per family stylesheet; the boot script builds the same id so it loads once. */
const fontLinkId = (id: GoogleFontId) => `font-preference-${id}`;

function addLink(doc: Document, attributes: Record<string, string>) {
  const link = doc.createElement('link');
  for (const [name, value] of Object.entries(attributes)) {
    link.setAttribute(name, value);
  }
  // A stylesheet that starts as `media=print` is fetched without blocking
  // rendering, then switched on when it arrives. A slow or blocked Google Fonts
  // request therefore leaves the fallback font showing; it never holds the page.
  if (attributes.rel === 'stylesheet') {
    link.onload = () => {
      link.media = 'all';
    };
  }
  doc.head.append(link);
}

function connectToGoogle(doc: Document) {
  if (doc.getElementById('font-preference-preconnect')) return;
  addLink(doc, {
    id: 'font-preference-preconnect',
    rel: 'preconnect',
    href: GOOGLE_STYLES,
  });
  addLink(doc, { rel: 'preconnect', href: GOOGLE_FILES, crossorigin: '' });
}

/** Adds the family's stylesheet the first time it is needed, and never again. */
function loadFont(doc: Document, id: GoogleFontId) {
  if (doc.getElementById(fontLinkId(id))) return;
  connectToGoogle(doc);
  addLink(doc, {
    id: fontLinkId(id),
    rel: 'stylesheet',
    media: 'print',
    href: fontStylesheetUrl(id),
  });
}

/**
 * Writes the chosen fonts to `--font-preference-*` on <html>, which the
 * `--font-*` role tokens read first (shared-styles.css, ADR-0003). `default`
 * removes the override so the role falls back to the font the app ships with.
 * A family is fetched from Google Fonts only when it is first chosen. Two
 * writers share this mapping: the settings provider (live changes) and the boot
 * script below (first paint, on every page).
 */
export function applyFontPreferences(root: HTMLElement, theme: FontFields) {
  for (const role of Object.keys(roleFields) as FontRole[]) {
    const choice: FontChoice = theme[roleFields[role]];
    const variable = fontPreferenceVariables[role];
    if (choice === 'default') {
      root.style.removeProperty(variable);
    } else {
      loadFont(root.ownerDocument, choice);
      root.style.setProperty(variable, fontStack(choice));
    }
  }
}

/**
 * The value that previews `choice` on one element without touching <html>. The
 * role tokens are `@theme inline`, so `font-heading` and friends read
 * `--font-preference-*` on the element that uses them: setting it on a preview
 * re-fonts only that preview. `initial` makes the variable invalid there, so the
 * role falls back to the shipped font even when <html> carries a saved override.
 */
export function previewFontValue(choice: FontChoice): string {
  return choice === 'default' ? 'initial' : fontStack(choice);
}

/** Inline style that previews every role of `fonts` on one element. */
export function previewFontStyle(fonts: FontFields): Record<string, string> {
  return Object.fromEntries(
    (Object.keys(roleFields) as FontRole[]).map((role) => [
      fontPreferenceVariables[role],
      previewFontValue(fonts[roleFields[role]]),
    ]),
  );
}

/** Fetches the family a preview shows, once, without applying it to the page. */
export function usePreviewFont(choice: FontChoice) {
  useEffect(() => {
    if (choice !== 'default') loadFont(document, choice);
  }, [choice]);
}

const bootCatalog = Object.fromEntries(
  (Object.keys(googleFonts) as GoogleFontId[]).map((id) => [
    id,
    [fontStylesheetUrl(id), fontStack(id)],
  ]),
);

const bootRoles = (Object.keys(roleFields) as FontRole[]).map((role) => [
  roleFields[role],
  fontPreferenceVariables[role],
]);

/**
 * Runs before the first paint, from the root layout. The settings provider only
 * mounts on the settings page and only after hydration, so without this the
 * chosen fonts would be missing on every other page and swap in late on this
 * one. It reads the raw saved JSON and accepts only ids from the catalog, so
 * tampered storage can neither throw nor inject a URL or a font stack.
 */
export const fontBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFERENCES_STORAGE_KEY,
)})||'{}');var t=s&&s.theme;if(!t||typeof t!=='object')return;var C=${JSON.stringify(
  bootCatalog,
)};var R=${JSON.stringify(
  bootRoles,
)};var d=document,r=d.documentElement;function l(a){var k=d.createElement('link');for(var n in a)k.setAttribute(n,a[n]);if(a.rel==='stylesheet')k.onload=function(){k.media='all'};d.head.appendChild(k)}for(var i=0;i<R.length;i++){var id=t[R[i][0]];if(typeof id!=='string'||!Object.prototype.hasOwnProperty.call(C,id))continue;if(!d.getElementById('font-preference-preconnect')){l({id:'font-preference-preconnect',rel:'preconnect',href:${JSON.stringify(
  GOOGLE_STYLES,
)}});l({rel:'preconnect',href:${JSON.stringify(
  GOOGLE_FILES,
)},crossorigin:''})}if(!d.getElementById('font-preference-'+id))l({id:'font-preference-'+id,rel:'stylesheet',media:'print',href:C[id][0]});r.style.setProperty(R[i][1],C[id][1])}}catch(x){}})();`;
