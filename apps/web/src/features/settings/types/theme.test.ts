import { describe, expect, it } from 'vitest';

import { densities, radii, themeDefaults, themeSchema } from './theme';

describe('theme settings', () => {
  it('defaults the shape of the app to what it looked like before these settings', () => {
    expect(themeDefaults.radius).toBe('default');
    expect(themeDefaults.density).toBe('comfortable');
  });

  it('still parses a theme saved before corner radius and density existed', () => {
    // Saved JSON, imports and the account row from earlier builds lack both fields.
    expect(themeSchema.parse({ mode: 'dark', bodyFont: 'lora' })).toMatchObject(
      { mode: 'dark', bodyFont: 'lora', radius: 'default', density: 'comfortable' },
    );
  });

  it.each(radii)('accepts the %s radius', (radius) => {
    expect(themeSchema.parse({ mode: 'light', radius }).radius).toBe(radius);
  });

  it.each(densities)('accepts the %s density', (density) => {
    expect(themeSchema.parse({ mode: 'light', density }).density).toBe(density);
  });

  it('rejects values that are not presets', () => {
    expect(themeSchema.safeParse({ mode: 'light', radius: 'pill' }).success).toBe(
      false,
    );
    expect(
      themeSchema.safeParse({ mode: 'light', density: 'tight' }).success,
    ).toBe(false);
  });

  it('names the presets the CSS defines, and no others', () => {
    // preferences.css has one [data-radius] / [data-density] rule per preset.
    expect([...radii]).toEqual(['sharp', 'default', 'rounded', 'round']);
    expect([...densities]).toEqual(['compact', 'comfortable', 'spacious']);
  });
});
