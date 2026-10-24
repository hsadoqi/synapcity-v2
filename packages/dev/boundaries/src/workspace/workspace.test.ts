import { realpathSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { createWorkspace } from '../testing/workspace/index.ts';
import { listSourceFiles, loadWorkspace } from './index.ts';

const manifest = (name: string, extra: object = {}) =>
  JSON.stringify({ name, ...extra });

let cleanup = () => {};
afterEach(() => cleanup());

function workspace(files: Record<string, string>) {
  const ws = createWorkspace(files);
  cleanup = ws.cleanup;
  return ws.root;
}

describe('loadWorkspace', () => {
  it('finds apps and packages with their categories', () => {
    const root = workspace({
      'apps/web/package.json': manifest('web'),
      'packages/frontend/ui/package.json': manifest('@synapcity/frontend-ui'),
      'packages/features/settings/package.json': manifest(
        '@synapcity/features-settings',
      ),
    });
    const byName = Object.fromEntries(
      loadWorkspace(root).packages.map((p) => [p.name, p.category]),
    );
    expect(byName).toEqual({
      web: 'app',
      '@synapcity/frontend-ui': 'frontend',
      '@synapcity/features-settings': 'features',
    });
  });

  it('marks the existing packages that keep their own layout as legacy', () => {
    const root = workspace({
      'packages/frontend/ui/package.json': manifest('@synapcity/frontend-ui'),
      'packages/frontend/site/package.json': manifest(
        '@synapcity/frontend-site',
      ),
      'packages/frontend/tailwind-config/package.json': manifest(
        '@synapcity/frontend-tailwind-config',
      ),
      'packages/dev/fixtures/package.json': manifest('@synapcity/dev-fixtures'),
      'packages/dev/anything/package.json': manifest('@synapcity/dev-anything'),
      'packages/frontend/shells/package.json': manifest(
        '@synapcity/frontend-shells',
      ),
      'apps/web/package.json': manifest('web'),
    });
    const legacy = Object.fromEntries(
      loadWorkspace(root).packages.map((p) => [p.name, p.legacy]),
    );
    expect(legacy).toEqual({
      '@synapcity/frontend-ui': true,
      '@synapcity/frontend-site': true,
      '@synapcity/frontend-tailwind-config': true,
      '@synapcity/dev-fixtures': true,
      '@synapcity/dev-anything': false,
      '@synapcity/frontend-shells': false,
      web: false,
    });
  });

  it('records workspace dependencies from dependencies and devDependencies, not npm ones', () => {
    const root = workspace({
      'packages/frontend/ui/package.json': manifest('@synapcity/frontend-ui', {
        dependencies: {
          '@synapcity/domain-records': 'workspace:*',
          react: '19.3.0',
        },
        devDependencies: { '@synapcity/dev-fixtures': 'workspace:*' },
      }),
    });
    const [ui] = loadWorkspace(root).packages;
    expect(ui?.dependencies.sort()).toEqual([
      '@synapcity/dev-fixtures',
      '@synapcity/domain-records',
    ]);
  });

  it('flattens exports and finds the tsconfig', () => {
    const root = workspace({
      'packages/server/data/package.json': manifest('@synapcity/server-data', {
        exports: {
          '.': './src/index.ts',
          './testing': { import: './src/testing/index.ts' },
        },
      }),
      'packages/server/data/tsconfig.json': '{}',
    });
    const [data] = loadWorkspace(root).packages;
    expect(data?.exports).toEqual({
      '.': './src/index.ts',
      './testing': './src/testing/index.ts',
    });
    expect(data?.tsconfig).toBe(`${data?.dir}/tsconfig.json`);
  });
});

describe('listSourceFiles', () => {
  it('lists source files and skips generated, installed and declaration files', () => {
    const files: Record<string, string> = {
      'packages/frontend/ui/package.json': manifest('@synapcity/frontend-ui'),
      'packages/frontend/ui/src/a.ts': '',
      'packages/frontend/ui/src/b.tsx': '',
      'packages/frontend/ui/vitest.config.ts': '',
      'packages/frontend/ui/src/types.d.ts': '',
    };
    for (const skipped of [
      'node_modules',
      '.next',
      'dist',
      'coverage',
      '.turbo',
      'storybook-static',
      'playwright-report',
      'test-results',
    ]) {
      files[`packages/frontend/ui/${skipped}/x.ts`] = '';
    }
    const root = workspace(files);
    const [ui] = loadWorkspace(root).packages;
    const listed = listSourceFiles(ui!)
      .map((f) => f.slice(ui!.dir.length + 1))
      .sort();
    expect(listed).toEqual(['src/a.ts', 'src/b.tsx', 'vitest.config.ts']);
  });

  it('scans a source folder that shares a name with build output, below the package root', () => {
    const root = workspace({
      'packages/frontend/ui/package.json': manifest('@synapcity/frontend-ui'),
      'packages/frontend/ui/src/dist/a.ts': '',
      'packages/frontend/ui/src/coverage/b.ts': '',
      'packages/frontend/ui/dist/generated.ts': '',
    });
    const [ui] = loadWorkspace(root).packages;
    expect(
      listSourceFiles(ui!)
        .map((f) => f.slice(ui!.dir.length + 1))
        .sort(),
    ).toEqual(['src/coverage/b.ts', 'src/dist/a.ts']);
  });
});

describe('loadWorkspace paths', () => {
  it('uses the real path of the root, so resolved paths and package directories agree', () => {
    const root = workspace({ 'apps/web/package.json': manifest('web') });
    const ws = loadWorkspace(root);
    expect(ws.root).toBe(realpathSync(root));
    expect(ws.packages[0]?.dir.startsWith(realpathSync(root))).toBe(true);
  });
});

describe('loadWorkspace categories', () => {
  it('fails on a package folder outside the five categories instead of skipping it', () => {
    const root = workspace({
      'packages/shared/x/package.json': manifest('@t/shared-x'),
    });
    expect(() => loadWorkspace(root)).toThrow('packages/shared');
  });
});
