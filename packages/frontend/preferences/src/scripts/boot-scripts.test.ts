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
    // This is set manually only when regenerating the checked-in fixture.
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (process.env.UPDATE_BOOT_SCRIPTS === '1') {
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
