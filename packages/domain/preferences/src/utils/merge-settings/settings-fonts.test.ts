import { settingsDefaults, settingsSchema } from '../../schemas';
import { describe, expect, it } from 'vitest';

import { mergeSettings, parseImport } from './merge-settings';

describe('font preferences through merging and import', () => {
  it('keeps the other fonts when one changes', () => {
    const first = mergeSettings(settingsDefaults, {
      theme: { headingFont: 'lora' },
    });
    const second = mergeSettings(first, { theme: { codeFont: 'fira-code' } });
    expect(second.theme).toMatchObject({
      headingFont: 'lora',
      bodyFont: 'default',
      codeFont: 'fira-code',
    });
    expect(settingsSchema.safeParse(second).success).toBe(true);
  });

  it('imports fonts, and ignores a font that is not offered', () => {
    const { settings } = parseImport({
      theme: { headingFont: 'fraunces', bodyFont: 'not-a-font' },
    });
    expect(settings.theme.headingFont).toBe('fraunces');
    expect(settings.theme.bodyFont).toBe('default');
  });
});
