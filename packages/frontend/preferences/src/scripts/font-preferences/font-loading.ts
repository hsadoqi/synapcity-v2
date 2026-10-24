import {
  googleFonts,
  type FontRole,
  type GoogleFontId,
} from '@synapcity/domain-preferences';

/*
 * Loading a chosen font in the browser: its stylesheet, its CSS stack and the
 * variables that carry it. Moves to frontend-preferences in M6.2.
 */

export const fontPreferenceVariables: Record<FontRole, string> = {
  heading: '--font-preference-heading',
  body: '--font-preference-body',
  code: '--font-preference-code',
};

/** The Google Fonts stylesheet that defines the family. */
export function fontStylesheetUrl(id: GoogleFontId): string {
  const { family, weights } = googleFonts[id];
  const query = family.split(' ').join('+');
  return `https://fonts.googleapis.com/css2?family=${query}:wght@${weights}&display=swap`;
}

/** The value written to `--font-preference-*`: the family, then a generic fallback. */
export function fontStack(id: GoogleFontId): string {
  const { family, generic } = googleFonts[id];
  return `'${family}', ${generic}`;
}
