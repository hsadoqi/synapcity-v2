import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { INK_ON_DARK, INK_ON_LIGHT } from './svg';

/*
 * Runs the real scripts (scripts/sync-brand-assets.mjs and
 * scripts/check-brand-assets.mjs) against a throwaway copy of the files they
 * look at, and breaks that copy one way at a time.
 */

const repo = join(import.meta.dirname, '..', '..', '..', '..');
const sync = join(repo, 'scripts', 'sync-brand-assets.mjs');
const check = join(repo, 'scripts', 'check-brand-assets.mjs');

const run = (script: string, root: string) =>
  spawnSync(process.execPath, [script, root], { encoding: 'utf8' });

const copy = (from: string, to: string) => {
  mkdirSync(join(to, '..'), { recursive: true });
  cpSync(from, to, { recursive: true });
};

const pristine = mkdtempSync(join(tmpdir(), 'brand-pristine-'));
let work = '';

/** The raster and consumer files the checker reads, copied from the repo. */
const RAW = [
  'apps/web/src/app/apple-icon.png',
  'apps/web/src/app/favicon.ico',
  'apps/docs/src/app/apple-icon.png',
  'apps/docs/src/app/favicon.ico',
  'apps/storybook/public/favicon.ico',
  'public/apple-icon.png',
  'public/favicon.ico',
  'packages/frontend/site/src/open-graph.tsx',
  'packages/frontend/ui/src/components/logo-mark/logo-mark.tsx',
];

beforeAll(() => {
  copy(
    join(repo, 'packages/frontend/brand/src'),
    join(pristine, 'packages/frontend/brand/src'),
  );
  for (const file of RAW) copy(join(repo, file), join(pristine, file));
  const result = run(sync, pristine);
  expect(result.status, result.stderr).toBe(0);
});

beforeEach(() => {
  if (work) rmSync(work, { recursive: true, force: true });
  work = mkdtempSync(join(tmpdir(), 'brand-work-'));
  cpSync(pristine, work, { recursive: true });
});

afterAll(() => {
  rmSync(pristine, { recursive: true, force: true });
  if (work) rmSync(work, { recursive: true, force: true });
});

const edit = (path: string, change: (text: string) => string) => {
  const full = join(work, path);
  writeFileSync(full, change(readFileSync(full, 'utf8')));
};

const failing = () => {
  const result = run(check, work);
  expect(result.status).toBe(1);
  return result.stderr;
};

describe('brand check', () => {
  it('passes on freshly synced files', () => {
    const result = run(check, work);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('sync is idempotent', () => {
    expect(run(sync, work).stdout).toContain('already in sync');
  });

  it('fails on a changed wordmark path and names the canonical source', () => {
    edit('packages/frontend/brand/assets/wordmark.svg', (t) =>
      t.replace('M0 547', 'M0 548'),
    );
    const out = failing();
    expect(out).toContain('packages/frontend/brand/assets/wordmark.svg');
    expect(out).toContain('src/manifest.ts');
  });

  it('fails on changed mark geometry in a public output', () => {
    edit('apps/web/public/brand-assets/mark-light.svg', (t) =>
      t.replace('rx="3.5"', 'rx="4"'),
    );
    expect(failing()).toContain(
      'apps/web/public/brand-assets/mark-light.svg: differs from',
    );
  });

  it('fails on a missing file', () => {
    rmSync(join(work, 'apps/web/public/brand-assets/logo.svg'));
    expect(failing()).toContain(
      'apps/web/public/brand-assets/logo.svg: missing',
    );
  });

  it('fails on a stale public output', () => {
    edit(
      'apps/web/public/brand-assets/logo-monochrome.svg',
      (t) => t.replace(INK_ON_LIGHT, INK_ON_DARK), // a stale ink, not a design colour
    );
    expect(failing()).toContain(
      'apps/web/public/brand-assets/logo-monochrome.svg',
    );
  });

  it('fails on a wrong Storybook alias', () => {
    // logo-dark.svg must be the dark-ink logo, not the adaptive one.
    writeFileSync(
      join(work, 'apps/storybook/public/brand-assets/logo-dark.svg'),
      readFileSync(join(work, 'packages/frontend/brand/assets/logo.svg')),
    );
    const out = failing();
    expect(out).toContain('apps/storybook/public/brand-assets/logo-dark.svg');
    expect(out).toContain('logo-monochrome.svg');
  });

  it.each([
    ['logo-light.svg', 'logo.svg', 'logo-monochrome.svg'],
    ['wordmark-dark.svg', 'wordmark-monochrome.svg', 'wordmark.svg'],
    ['wordmark-light.svg', 'wordmark.svg', 'wordmark-monochrome.svg'],
  ])('fails when %s stops matching %s', (alias, target, other) => {
    writeFileSync(
      join(work, `apps/storybook/public/brand-assets/${alias}`),
      readFileSync(join(work, `packages/frontend/brand/assets/${other}`)),
    );
    const out = failing();
    expect(out).toContain(`apps/storybook/public/brand-assets/${alias}`);
    expect(out).toContain(target);
  });

  it('fails when a Storybook alias is missing', () => {
    rmSync(join(work, 'apps/storybook/public/brand-assets/wordmark-light.svg'));
    expect(failing()).toContain('wordmark-light.svg: missing');
  });

  it('fails when the two app icons differ', () => {
    edit('apps/docs/src/app/icon.svg', (t) =>
      t.replace('<style>', '<style>/* stale */'),
    );
    expect(failing()).toContain('apps/docs/src/app/icon.svg: differs');
  });

  it('fails when the app rasters differ', () => {
    writeFileSync(
      join(work, 'apps/docs/src/app/favicon.ico'),
      Buffer.from('not an icon'),
    );
    const out = failing();
    expect(out).toContain('apps/docs/src/app/favicon.ico: is not a ICO file');
    expect(out).toContain('differs from apps/web/src/app/favicon.ico');
  });

  it('fails on an unexpected variant in a brand directory', () => {
    writeFileSync(
      join(work, 'apps/web/public/brand-assets/logo-blue.svg'),
      '<svg/>',
    );
    expect(failing()).toContain('logo-blue.svg: unexpected file');
  });

  it('fails on a hand-copied outline outside the package', () => {
    mkdirSync(join(work, 'apps/web/src'), { recursive: true });
    const geometry = readFileSync(
      join(work, 'packages/frontend/brand/src/geometry.ts'),
      'utf8',
    );
    const path = geometry.match(/WORDMARK_PATH =\s*'([^']+)'/)?.[1] ?? '';
    writeFileSync(
      join(work, 'apps/web/src/copy.ts'),
      `export const x = '${path}';`,
    );
    expect(failing()).toContain('apps/web/src/copy.ts: carries its own copy');
  });

  it('fails when the social card goes back to a literal', () => {
    edit('packages/frontend/site/src/open-graph.tsx', (t) =>
      t.replace('@synapcity/frontend-brand/svg', 'nowhere'),
    );
    expect(failing()).toContain('open-graph.tsx');
  });
});
