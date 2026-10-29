import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
 * The ownership model, enforced rather than remembered:
 *
 * - the default typefaces are loaded in one file, `src/next/fonts.ts` here;
 * - the Geist files exist once, beside it;
 * - every host (web, docs, Storybook) puts the variable classes from this
 *   package on `<html>` and declares the dependency.
 *
 * `pnpm boundaries` already stops a package importing an app, and rule R11
 * keeps `next/*` under `src/next/`; these checks add what it cannot see: a
 * second copy of a font file, or a second loader somewhere else.
 */

const repo = join(import.meta.dirname, '..', '..', '..', '..');
const SKIPPED = new Set([
  'node_modules',
  '.next',
  '.turbo',
  '.git',
  'storybook-static',
  'dist',
  'coverage',
]);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (SKIPPED.has(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const posix = (path: string) => relative(repo, path).split(sep).join('/');
const all = ['apps', 'packages'].flatMap((dir) => files(join(repo, dir)));

describe('font files', () => {
  it('exist once each: here, plus the tokens package own self-hosted pair', () => {
    const binaries = all
      .filter((path) => /\.(woff2?|ttf|otf|eot)$/i.test(path))
      .map(posix)
      .sort();
    expect(binaries).toEqual([
      'packages/frontend/fonts/src/next/GeistMonoVF.woff',
      'packages/frontend/fonts/src/next/GeistVF.woff',
      // frontend-tokens is a candidate package with its own @font-face rules
      // (its README, "Fonts"); it does not hold the Geist defaults.
      'packages/frontend/tokens/assets/fonts/Inter-Variable.woff2',
      'packages/frontend/tokens/assets/fonts/JetBrainsMono-Variable.woff2',
    ]);
  });
});

describe('next/font', () => {
  it('is imported by the loader file and nothing else', () => {
    const importers = all
      .filter((path) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path))
      .filter((path) =>
        /\bfrom\s+['"]next\/font\//.test(readFileSync(path, 'utf8')),
      )
      .map(posix);
    expect(importers).toEqual(['packages/frontend/fonts/src/next/fonts.ts']);
  });
});

describe('the hosts', () => {
  const entry = '@synapcity/frontend-fonts/next';
  const hosts: Record<string, { manifest: string; files: string[] }> = {
    web: {
      manifest: 'apps/web/package.json',
      files: [
        'apps/web/src/app/layout.tsx',
        'apps/web/src/app/global-error.tsx',
      ],
    },
    docs: {
      manifest: 'apps/docs/package.json',
      files: ['apps/docs/src/app/layout.tsx'],
    },
    storybook: {
      manifest: 'apps/storybook/package.json',
      files: ['apps/storybook/.storybook/preview.tsx'],
    },
  };

  // A later @font-face wins for a character both cover, and CSS reaches the
  // page in import order. frontend-tokens declares its own un-ranged `Inter`
  // face, so a layout that imports the fonts before the stylesheet puts that
  // face last, and the browser downloads it as well as next/font's. Web and
  // docs import the stylesheet first, so next/font's faces come last.
  for (const layout of [
    'apps/web/src/app/layout.tsx',
    'apps/docs/src/app/layout.tsx',
  ]) {
    it(`${layout} imports its stylesheet before the fonts`, () => {
      const source = readFileSync(join(repo, layout), 'utf8');
      const css = source.search(/import\s+['"][^'"]*globals\.css['"]/);
      const fonts = source.indexOf(`from '${entry}'`);
      expect(css).toBeGreaterThanOrEqual(0);
      expect(fonts).toBeGreaterThan(css);
    });
  }

  for (const [name, host] of Object.entries(hosts)) {
    it(`${name} declares the package and imports its classes from ${entry}`, () => {
      const manifest = JSON.parse(
        readFileSync(join(repo, host.manifest), 'utf8'),
      ) as { dependencies?: Record<string, string> };
      expect(manifest.dependencies?.['@synapcity/frontend-fonts']).toBe(
        'workspace:*',
      );
      for (const file of host.files) {
        const source = readFileSync(join(repo, file), 'utf8');
        expect(source, file).toContain(`from '${entry}'`);
      }
    });
  }
});
