import { realpathSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createWorkspace } from '../testing/workspace/index.ts';
import { loadWorkspace } from '../workspace/index.ts';
import { createResolver } from './index.ts';

let root = '';
let cleanup = () => {};
let resolve: ReturnType<typeof createResolver>;

beforeAll(() => {
  const ws = createWorkspace(
    {
      'packages/frontend/a/package.json': JSON.stringify({
        name: '@x/a',
        exports: { '.': './src/index.ts', './sub/*': './src/sub/*/index.ts' },
      }),
      'packages/frontend/a/src/index.ts': '',
      'packages/frontend/a/src/sub/thing/index.ts': '',
      'packages/frontend/a/src/private/file.ts': '',
      'apps/web/package.json': JSON.stringify({ name: 'web' }),
      'apps/web/tsconfig.json': JSON.stringify({
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } },
      }),
      'apps/web/src/page.tsx': '',
      'apps/web/src/lib/util.ts': '',
      'apps/web/src/util.ts': '',
      'apps/web/src/folder/index.ts': '',
      'apps/web/src/styles.css': '',
      'apps/web/node_modules/zod/package.json': JSON.stringify({
        name: 'zod',
        main: 'index.js',
      }),
      'apps/web/node_modules/zod/index.js': '',
      'apps/web/node_modules/@scope/pkg/package.json': JSON.stringify({
        name: '@scope/pkg',
      }),
      'apps/web/node_modules/@scope/pkg/deep.js': '',
    },
    { 'apps/web/node_modules/@x/a': 'packages/frontend/a' },
  );
  root = ws.root;
  cleanup = ws.cleanup;
  resolve = createResolver(loadWorkspace(root));
});
afterAll(() => cleanup());

const real = (path: string) => join(realpathSync(root), path);
const page = () => join(root, 'apps/web/src/page.tsx');

describe('createResolver', () => {
  it('resolves workspace packages through their exports', () => {
    expect(resolve(page(), '@x/a')).toEqual({
      kind: 'path',
      path: real('packages/frontend/a/src/index.ts'),
    });
    expect(resolve(page(), '@x/a/sub/thing')).toEqual({
      kind: 'path',
      path: real('packages/frontend/a/src/sub/thing/index.ts'),
    });
  });

  it('treats a subpath outside exports as unresolved', () => {
    expect(resolve(page(), '@x/a/private/file')).toEqual({
      kind: 'unresolved',
    });
  });

  it('resolves tsconfig paths', () => {
    expect(resolve(page(), '@/lib/util')).toEqual({
      kind: 'path',
      path: real('apps/web/src/lib/util.ts'),
    });
  });

  it('resolves relative files, folder indexes and the .js extension alias', () => {
    expect(resolve(page(), './util')).toEqual({
      kind: 'path',
      path: real('apps/web/src/util.ts'),
    });
    expect(resolve(page(), './folder')).toEqual({
      kind: 'path',
      path: real('apps/web/src/folder/index.ts'),
    });
    expect(resolve(page(), './util.js')).toEqual({
      kind: 'path',
      path: real('apps/web/src/util.ts'),
    });
  });

  it('resolves a stylesheet to its path', () => {
    expect(resolve(page(), './styles.css')).toEqual({
      kind: 'path',
      path: real('apps/web/src/styles.css'),
    });
  });

  it('reports installed npm packages and Node built-ins as external by package name', () => {
    expect(resolve(page(), 'zod')).toEqual({ kind: 'external', name: 'zod' });
    expect(resolve(page(), '@scope/pkg/deep')).toEqual({
      kind: 'external',
      name: '@scope/pkg',
    });
    expect(resolve(page(), 'node:fs')).toEqual({
      kind: 'external',
      name: 'node:fs',
    });
  });

  it('reports a missing module as unresolved', () => {
    expect(resolve(page(), './missing')).toEqual({ kind: 'unresolved' });
  });
});
