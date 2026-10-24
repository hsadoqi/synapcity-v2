import { describe, expect, it } from 'vitest';

import { settingsDefaults, settingsSchema } from './settings';

/*
 * What browsers already hold in `synapcity-preferences` must read the same
 * after the rules moved into this package. These are literal values, not
 * derived from the schema, so a changed default or a renamed field fails here.
 */
describe('a saved preferences document', () => {
  it('reads one saved before fonts, density and text size to the same settings', () => {
    const saved =
      '{"regional":{"language":"fr"},"theme":{"mode":"dark","radius":"soft"}}';

    expect(settingsSchema.parse(JSON.parse(saved))).toEqual({
      regional: {
        language: 'fr',
        timeFormat: '12-hour',
        dateFormat: settingsDefaults.regional.dateFormat,
        numberFormat: '1,000.00',
        timezone: settingsDefaults.regional.timezone,
        firstDayOfWeek: settingsDefaults.regional.firstDayOfWeek,
      },
      appearance: settingsDefaults.appearance,
      notifications: settingsDefaults.notifications,
      privacy: settingsDefaults.privacy,
      theme: {
        mode: 'dark',
        headingFont: 'default',
        bodyFont: 'default',
        codeFont: 'default',
        radius: 'soft',
        density: 'comfortable',
        textSize: 100,
      },
    });
  });

  it('parses its own defaults to themselves', () => {
    expect(settingsSchema.parse(settingsDefaults)).toEqual(settingsDefaults);
  });
});
