import type { Edge, SourceFile, Workspace } from '../../model/index.ts';
import { buildEdges } from '../../rules/edge-rules/index.ts';
import { loadWorkspace } from '../../workspace/index.ts';
import { createWorkspace } from '../workspace/index.ts';

/** Probe fixture shared by the rule tests: one package per category, two apps, and fake npm installs. */
export const manifest = (name: string, extra: object = {}) =>
  JSON.stringify({ name, type: 'module', ...extra });

export const BASE: Record<string, string> = {
  'packages/domain/d/package.json': manifest('@t/domain-d', {
    exports: { '.': './src/index.ts' },
  }),
  'packages/domain/d/src/index.ts': 'export const d = 1;',
  'packages/frontend/f/package.json': manifest('@t/frontend-f', {
    exports: { '.': './src/index.ts' },
  }),
  'packages/frontend/f/src/index.ts': `import { d } from '@t/domain-d';\nexport const f = d;`,
  'packages/frontend/f/src/next/link.tsx': `import Link from 'next/link';\nexport { Link };`,
  'packages/server/s/package.json': manifest('@t/server-s', {
    exports: { '.': './src/index.ts', './testing': './src/testing/index.ts' },
  }),
  'packages/server/s/src/index.ts': 'export const s = 1;',
  'packages/server/s/src/testing/index.ts': 'export const fake = 1;',
  'packages/features/feat/package.json': manifest('@t/features-feat'),
  'packages/features/feat/src/contracts/index.ts':
    'export type C = { id: string };',
  'packages/features/feat/src/frontend/index.ts': `import type { C } from '../contracts/index.ts';\nexport type F = C;`,
  'packages/features/feat/src/server/index.ts': `import { s } from '@t/server-s';\nexport const load = () => s;`,
  'packages/features/feat/src/testing/index.ts':
    'export const fakeLoad = () => 1;',
  'packages/features/feat/src/frontend/a/a.ts': 'export const a = 1;',
  'packages/features/feat/src/frontend/a/index.ts': `export { a } from './a.ts';`,
  'packages/dev/fx/package.json': manifest('@synapcity/dev-fx', {
    exports: { '.': './src/index.ts' },
  }),
  'packages/dev/fx/src/index.ts': 'export const fixture = 1;',
  'apps/web/package.json': manifest('web'),
  'apps/web/src/page.tsx': `import { f } from '@t/frontend-f';\nimport './styles.css';\nimport logo from './logo.svg';\nexport default function Page() { return f + String(logo); }`,
  'apps/web/src/styles.css': '',
  'apps/web/src/logo.svg': '<svg/>',
  'apps/web/vitest.config.ts': `import { fixture } from '@synapcity/dev-fx';\nexport default fixture;`,
  'apps/web/src/page.test.ts': `import { fixture } from '@synapcity/dev-fx';\nimport { fake } from '@t/server-s/testing';\nexport const t = fixture + fake;`,
  'apps/other/package.json': manifest('other'),
  'apps/other/src/x.ts': 'export const x = 1;',
  'node_modules/zod/package.json': manifest('zod', { main: 'index.js' }),
  'node_modules/zod/index.js': '',
  'node_modules/react/package.json': manifest('react', { main: 'index.js' }),
  'node_modules/react/index.js': '',
  'node_modules/next/package.json': manifest('next'),
  'node_modules/next/link.js': '',
};

export const LINKS = {
  'node_modules/@t/domain-d': 'packages/domain/d',
  'node_modules/@t/frontend-f': 'packages/frontend/f',
  'node_modules/@t/server-s': 'packages/server/s',
  'node_modules/@t/features-feat': 'packages/features/feat',
  'node_modules/@synapcity/dev-fx': 'packages/dev/fx',
};

export interface Probe {
  workspace: Workspace;
  files: Map<string, SourceFile>;
  edges: Edge[];
  cleanup(): void;
}

/** Writes BASE plus `extra` (which may override BASE files) and builds its edges. */
export function probe(extra: Record<string, string> = {}): Probe {
  const ws = createWorkspace({ ...BASE, ...extra }, LINKS);
  const workspace = loadWorkspace(ws.root);
  return { workspace, ...buildEdges(workspace), cleanup: ws.cleanup };
}
