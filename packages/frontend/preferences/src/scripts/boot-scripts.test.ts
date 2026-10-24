import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import expected from './boot-scripts.expected.json';
import { appearanceBootScript } from './appearance-attributes';
import { fontBootScript } from './font-preferences';
import { themeShapeBootScript } from './theme-shape';

describe('boot scripts', () => {
  it('inlines each boot script exactly as recorded in the fixture', () => {
    const current = {
      appearance: appearanceBootScript,
      themeShape: themeShapeBootScript,
      font: fontBootScript,
    };
    if (process.argv.includes('--update')) {
      writeFileSync(
        join(process.cwd(), 'src/scripts/boot-scripts.expected.json'),
        `${JSON.stringify(current, null, 2)}\n`,
      );
      return;
    }
    expect(current.appearance).toBe(expected.appearance);
    expect(current.themeShape).toBe(expected.themeShape);
    expect(current.font).toBe(expected.font);
  });
});
