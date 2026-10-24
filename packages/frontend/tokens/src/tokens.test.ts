import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * The token layer is plain CSS with no build step, so a missing import or a
 * moved font file would only show up as a styling or 404 bug in the browser.
 * These checks read the files directly.
 */

const src = fileURLToPath(new URL('.', import.meta.url));
const root = join(src, '..');
const read = (file: string) => readFileSync(join(src, file), 'utf8');
const cssFiles = readdirSync(src).filter((f) => f.endsWith('.css'));

/** The theme bridge is its own export, loaded after Tailwind; index.css does not import it. */
const SEPARATE_ENTRIES = new Set(['index.css', 'tailwind-theme.css']);

describe('frontend-tokens', () => {
  it('imports every token file from index.css', () => {
    const imported = [
      ...read('index.css').matchAll(/@import '\.\/([^']+)'/g),
    ].map((m) => m[1]);
    const tokenFiles = cssFiles.filter((f) => !SEPARATE_ENTRIES.has(f));
    expect([...imported].sort()).toEqual([...tokenFiles].sort());
  });

  it('points every url() at a file that exists', () => {
    for (const file of cssFiles) {
      for (const [, target] of read(file).matchAll(/url\('([^']+)'\)/g)) {
        expect(
          existsSync(join(dirname(join(src, file)), target!)),
          `${file}: ${target}`,
        ).toBe(true);
      }
    }
  });

  it('keeps element rules in the base layer so utilities still win', () => {
    // Unlayered rules beat every Tailwind layer, so an unlayered `a { color }`
    // would override `text-*` on every link.
    const rules = read('base.css')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
    expect(rules.startsWith('@layer base {')).toBe(true);
    expect(rules.endsWith('}')).toBe(true);
  });

  it('never wraps a colour variable in rgb()', () => {
    // The ramps are hex values, and `rgb(<hex> / 0.2)` is invalid CSS: the
    // browser drops the declaration. Use color-mix() for alpha instead.
    for (const file of cssFiles) {
      expect(read(file), file).not.toMatch(/rgb\(\s*var\(/);
    }
  });

  it('exports files that exist', () => {
    const { exports } = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8'),
    ) as {
      exports: Record<string, string>;
    };
    for (const target of Object.values(exports)) {
      expect(existsSync(join(root, target)), target).toBe(true);
    }
  });
});
