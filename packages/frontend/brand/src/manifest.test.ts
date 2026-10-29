import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  appIcon,
  canonicalAssets,
  storybookAliases,
  webPublicFiles,
} from './manifest';

const assets = join(import.meta.dirname, '..', 'assets');
const names = canonicalAssets.map((asset) => asset.file);

describe('manifest', () => {
  it('lists exactly the files in assets/, no more and no fewer', () => {
    expect(readdirSync(assets).sort()).toEqual([...names].sort());
  });

  it.each(canonicalAssets.map((asset) => [asset.file, asset] as const))(
    'assets/%s is the exact output of its builder',
    (file, asset) => {
      expect(readFileSync(join(assets, file), 'utf8')).toBe(asset.content());
    },
  );

  it('names every file once', () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps the six public web URLs', () => {
    expect([...webPublicFiles].sort()).toEqual([
      'logo-monochrome.svg',
      'logo.svg',
      'mark-dark.svg',
      'mark-light.svg',
      'wordmark-monochrome.svg',
      'wordmark.svg',
    ]);
    for (const file of webPublicFiles) expect(names).toContain(file);
  });

  it('points every alias at a canonical file and never shadows one', () => {
    for (const { alias, target } of storybookAliases) {
      expect(names).toContain(target);
      expect(names).not.toContain(alias);
    }
  });

  it('keeps every Storybook name that was ever served, as an alias', () => {
    expect(storybookAliases).toEqual([
      { alias: 'logo-dark.svg', target: 'logo-monochrome.svg' },
      { alias: 'logo-light.svg', target: 'logo.svg' },
      { alias: 'wordmark-dark.svg', target: 'wordmark-monochrome.svg' },
      { alias: 'wordmark-light.svg', target: 'wordmark.svg' },
    ]);
  });

  it('maps logo-dark.svg to the dark-ink logo and keeps logo-on-dark.svg canonical', () => {
    expect(storybookAliases).toContainEqual({
      alias: 'logo-dark.svg',
      target: 'logo-monochrome.svg',
    });
    expect(names).toContain('logo-on-dark.svg');
  });

  it('builds the app icon as icon.svg', () => {
    expect(appIcon.file).toBe('icon.svg');
    expect(appIcon.content().endsWith('</svg>\n')).toBe(true);
  });
});
