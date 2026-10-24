import { describe, expect, it } from 'vitest';
import expected from './boot-scripts.expected.json';
import { appearanceBootScript } from './appearance-attributes';
import { fontBootScript } from './font-preferences';
import { themeShapeBootScript } from './theme-shape';

describe('boot scripts', () => {
  it('inlines each boot script exactly as recorded in the fixture', () => {
    expect(appearanceBootScript).toBe(expected.appearance);
    expect(themeShapeBootScript).toBe(expected.themeShape);
    expect(fontBootScript).toBe(expected.font);
  });
});
