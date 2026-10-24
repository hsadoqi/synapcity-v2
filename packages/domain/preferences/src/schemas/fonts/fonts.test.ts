import { describe, expect, it } from 'vitest';

import { settingsDefaults } from '../settings';
import { themeSchema } from '../theme';
import {
  bodyFonts,
  codeFonts,
  fontLabel,
  googleFonts,
  headingFonts,
  type GoogleFontId,
} from './fonts';

const roleLists = { headingFonts, bodyFonts, codeFonts };

describe('font catalog', () => {
  it.each(Object.entries(roleLists))(
    '%s starts with default and names only known families, once each',
    (_name, ids) => {
      expect(ids[0]).toBe('default');
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids.slice(1)) expect(googleFonts).toHaveProperty(id);
    },
  );

  it('uses a generic fallback that fits the role', () => {
    for (const id of codeFonts.slice(1)) {
      expect(googleFonts[id as GoogleFontId].generic).toBe('monospace');
    }
  });

  it('labels the default with the font the role ships with', () => {
    expect(fontLabel('heading', 'default')).toBe('Default (Geist)');
    expect(fontLabel('body', 'default')).toBe('Default (Inter)');
    expect(fontLabel('code', 'default')).toBe('Default (Geist Mono)');
    expect(fontLabel('code', 'fira-code')).toBe('Fira Code');
  });
});

describe('font preferences in the settings schema', () => {
  it('defaults every font so settings saved before they existed still parse', () => {
    const theme = themeSchema.parse({ mode: 'dark' });
    expect(theme).toEqual({
      mode: 'dark',
      headingFont: 'default',
      bodyFont: 'default',
      codeFont: 'default',
      radius: 'default',
      density: 'comfortable',
      textSize: 100,
    });
    expect(settingsDefaults.theme.headingFont).toBe('default');
  });

  it('rejects a font that is not in the catalog for that role', () => {
    expect(
      themeSchema.safeParse({ mode: 'light', codeFont: 'poppins' }).success,
    ).toBe(false);
    expect(
      themeSchema.safeParse({ mode: 'light', headingFont: 'comic-sans' })
        .success,
    ).toBe(false);
  });
});
