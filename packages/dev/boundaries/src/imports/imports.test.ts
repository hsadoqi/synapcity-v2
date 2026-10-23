import { describe, expect, it } from 'vitest';

import { readModule } from './index.ts';

const imports = (source: string, path = 'file.ts') =>
  readModule(path, source).imports;

describe('readModule imports', () => {
  it('reads a named import', () => {
    expect(imports(`import { a } from './a';`)).toEqual([
      {
        specifier: './a',
        typeOnly: false,
        kind: 'import',
        literal: true,
        line: 1,
      },
    ]);
  });

  it('marks import type and all-type named imports as type-only', () => {
    expect(imports(`import type { T } from './t';`)[0]?.typeOnly).toBe(true);
    expect(imports(`import { type T, type U } from './t';`)[0]?.typeOnly).toBe(
      true,
    );
    expect(imports(`import { type T, value } from './t';`)[0]?.typeOnly).toBe(
      false,
    );
  });

  it('reads re-exports as export edges', () => {
    const records = imports(`export * from './b';\nexport { x } from './c';`);
    expect(records.map((r) => [r.specifier, r.kind, r.line])).toEqual([
      ['./b', 'export', 1],
      ['./c', 'export', 2],
    ]);
  });

  it('marks export type as type-only', () => {
    expect(imports(`export type { T } from './t';`)[0]?.typeOnly).toBe(true);
  });

  it('reads a side-effect import', () => {
    expect(imports(`import './side';`)[0]?.kind).toBe('side-effect');
  });

  it('reads literal and non-literal dynamic imports', () => {
    const records = imports(
      `const a = await import('./lazy');\nconst b = await import(name);`,
    );
    expect(records).toEqual([
      {
        specifier: './lazy',
        typeOnly: false,
        kind: 'dynamic',
        literal: true,
        line: 1,
      },
      {
        specifier: '',
        typeOnly: false,
        kind: 'dynamic',
        literal: false,
        line: 2,
      },
    ]);
  });

  it('ignores local exports that have no module request', () => {
    expect(imports(`export const a = 1;\nexport { a as b };`)).toEqual([]);
  });
});

describe('readModule directive', () => {
  it('reads use client and use server as the first statement', () => {
    expect(readModule('a.ts', `'use client';\nimport './x';`).directive).toBe(
      'use client',
    );
    expect(
      readModule('a.ts', `"use server";\nexport async function act() {}`)
        .directive,
    ).toBe('use server');
  });

  it('ignores a directive that follows other code', () => {
    expect(
      readModule('a.ts', `import './x';\n'use client';`).directive,
    ).toBeNull();
  });
});

describe('readModule parsing', () => {
  it('parses TSX', () => {
    const result = readModule(
      'a.tsx',
      `import { B } from './b';\nexport const A = () => <B prop={1} />;`,
    );
    expect(result.parseError).toBeNull();
    expect(result.imports[0]?.specifier).toBe('./b');
  });

  it('reports a parse error without throwing', () => {
    const result = readModule('a.ts', `import { from './broken'`);
    expect(result.parseError).not.toBeNull();
  });
});
