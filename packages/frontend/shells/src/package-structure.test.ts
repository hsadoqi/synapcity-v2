import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
 * The package's layout contract, enforced rather than remembered (the same
 * contract `frontend-ui` and `frontend-collection` follow):
 *
 * - every component is a folder named after it, holding the component, its
 *   stories, its tests and an index that is the folder's public surface;
 * - no component file sits loose beside its siblings;
 * - `next/*` is imported only under `src/next/` (rule R11; `pnpm boundaries`
 *   enforces it too, this keeps the failure next to the code);
 * - every `exports` entry resolves to a real file.
 */

const root = join(import.meta.dirname, '..');
const src = join(root, 'src');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  name: string;
  exports: Record<string, string>;
};

/** Directories whose children are component folders. */
const COMPONENT_ROOTS = ['components', 'providers', 'next'] as const;

const list = (dir: string) => (existsSync(dir) ? readdirSync(dir).sort() : []);
const dirs = (dir: string) =>
  list(dir).filter(
    (name) => !name.startsWith('.') && statSync(join(dir, name)).isDirectory(),
  );

/** Every folder that holds `<folder>/<folder>.tsx`, at any depth under a root. */
function componentFolders(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of dirs(dir)) {
      const path = join(dir, name);
      if (existsSync(join(path, `${name}.tsx`))) found.push(path);
      walk(path);
    }
  };
  for (const base of COMPONENT_ROOTS) walk(join(src, base));
  return found.sort();
}

function sourceFiles(dir = src): string[] {
  return list(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const rel = (path: string) => relative(src, path);

describe('component folders', () => {
  const folders = componentFolders();

  it('has its component, index, stories and tests in every folder', () => {
    const missing: string[] = [];
    for (const folder of folders) {
      const name = folder.split('/').at(-1)!;
      for (const file of [
        `${name}.tsx`,
        'index.ts',
        `${name}.stories.tsx`,
        `${name}.test.tsx`,
      ]) {
        if (!existsSync(join(folder, file))) {
          missing.push(`${rel(folder)}/${file}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('leaves no component file loose beside its siblings', () => {
    const loose: string[] = [];
    for (const base of COMPONENT_ROOTS) {
      for (const name of list(join(src, base))) {
        if (/\.tsx$/.test(name)) loose.push(`${base}/${name}`);
      }
    }

    expect(loose).toEqual([]);
  });
});

describe('imports', () => {
  const importPattern =
    /\bfrom\s+['"]([^'"]+)['"]|\bimport\s+['"]([^'"]+)['"]/g;

  it('imports next/* only under src/next/', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      if (rel(file).startsWith('next/')) continue;
      for (const match of readFileSync(file, 'utf8').matchAll(importPattern)) {
        const specifier = match[1] ?? match[2]!;
        if (specifier === 'next' || specifier.startsWith('next/')) {
          offenders.push(`${rel(file)} -> ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('package.json exports', () => {
  it('exposes the portable root and the Next.js binding', () => {
    expect(Object.keys(pkg.exports).sort()).toEqual(['.', './next']);
  });

  it('points every entry at a file', () => {
    for (const [key, target] of Object.entries(pkg.exports)) {
      expect(existsSync(join(root, target)), `${key} -> ${target}`).toBe(true);
    }
  });
});
