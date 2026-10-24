import { describe, expect, it } from 'vitest';
import expected from './boot-scripts.expected.json';
import { appearanceBootScript } from './appearance-attributes';
import { fontBootScript } from './font-preferences';
import { themeShapeBootScript } from './theme-shape';

describe('boot scripts', () => {
  it('inlines each boot script exactly as before the move', () => {
    expect(appearanceBootScript).toBe(expected.appearance);
    expect(themeShapeBootScript).toBe(expected.themeShape);
    expect(fontBootScript).toBe(expected.font);
  });
});
