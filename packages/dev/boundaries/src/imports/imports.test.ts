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

  it('does not count a local re-export of an imported binding as a second edge', () => {
    expect(imports(`import { s } from './s';\nexport { s };`)).toEqual([
      {
        specifier: './s',
        typeOnly: false,
        kind: 'import',
        literal: true,
        line: 1,
      },
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

describe('readModule edges the module record omits', () => {
  it('reads require() calls and import = require', () => {
    expect(
      imports(`const a = require('a');\nimport b = require('b');`).map((i) => [
        i.specifier,
        i.kind,
        i.literal,
      ]),
    ).toEqual([
      ['a', 'require', true],
      ['b', 'require', true],
    ]);
  });

  it('flags a require() with a computed argument as non-literal', () => {
    const [record] = imports(`const m = require(name);`);
    expect(record).toMatchObject({ kind: 'require', literal: false });
  });

  it('reads type-position import("x").T as a type-only edge', () => {
    expect(imports(`type T = import('./t').T;`)).toEqual([
      expect.objectContaining({
        specifier: './t',
        kind: 'import-type',
        typeOnly: true,
      }),
    ]);
  });

  it('marks import type x = require as type-only', () => {
    expect(imports(`import type x = require('x');`)[0]?.typeOnly).toBe(true);
  });
});

describe('readModule leadingImport', () => {
  const leading = (source: string) => readModule('f.ts', source).leadingImport;

  it('is the specifier of a first bare import, after directives and comments', () => {
    expect(leading(`'use server';\n// guard\nimport 'server-only';`)).toBe(
      'server-only',
    );
  });

  it('is null when code or another import comes first', () => {
    expect(leading(`const a = 1;\nimport 'server-only';`)).toBeNull();
    expect(
      leading(`import { a } from './a';\nimport 'server-only';`),
    ).toBeNull();
  });
});
