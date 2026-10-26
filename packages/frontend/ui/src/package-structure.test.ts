import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
 * The package's layout contract, enforced rather than remembered:
 *
 * - every component is a folder named after it, holding the component, its
 *   stories, its tests and an index that is the folder's public surface;
 * - code reaches other folders through `@synapcity/frontend-ui/*`; a relative
 *   path may only name a file in the same folder (`./sibling`);
 * - every such specifier, and every `exports` entry, resolves to a real file;
 * - imports only point down the layers: lib and hooks, then core (shadcn),
 *   then components, then blocks. A leaf block imports no other block; a
 *   composite block (listed in COMPOSITE_BLOCKS) may import leaf blocks only.
 *   No file imports the index of the folder it sits in.
 */

const root = join(import.meta.dirname, '..');
const src = join(root, 'src');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  name: string;
  exports: Record<string, string>;
};

/** Directories whose children are component folders. */
const COMPONENT_ROOTS = [
  'components',
  'components/ui',
  'blocks',
  'next',
] as const;

const list = (dir: string) => readdirSync(dir).sort();
// Hidden folders (editor or tool state such as `.claude/`) are never components.
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
  return [...new Set(found)].sort();
}

function sourceFiles(dir = src): string[] {
  return list(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const rel = (path: string) => relative(src, path);

/** Resolve `@synapcity/frontend-ui/<subpath>` through package.json `exports`. */
function resolveExport(specifier: string): string | null {
  const subpath = `.${specifier.slice(pkg.name.length)}`;
  for (const [key, target] of Object.entries(pkg.exports)) {
    if (key === subpath) return join(root, target);
    const star = key.indexOf('*');
    if (star === -1) continue;
    const prefix = key.slice(0, star);
    const suffix = key.slice(star + 1);
    if (
      subpath.startsWith(prefix) &&
      subpath.endsWith(suffix) &&
      subpath.length > prefix.length + suffix.length
    ) {
      const match = subpath.slice(
        prefix.length,
        subpath.length - suffix.length,
      );
      return join(root, target.replace('*', match));
    }
  }
  return null;
}

/**
 * Blocks that compose other blocks. Every other block is a leaf and imports
 * no block at all; a composite imports leaves, never another composite.
 */
const COMPOSITE_BLOCKS = new Set(['day-agenda']);

const LAYER_RANK = { lib: 0, core: 1, components: 2, block: 3 } as const;
type Layer =
  | { kind: 'lib' | 'core' | 'components' }
  | { kind: 'block'; name: string };

/** The layer a source file belongs to, from its path under `src/`. */
function layerOfFile(path: string): Layer | null {
  const [top, second] = path.split('/');
  if (top === 'lib' || top === 'hooks') return { kind: 'lib' };
  if (top === 'components') {
    return second === 'ui' ? { kind: 'core' } : { kind: 'components' };
  }
  // `blocks/index.ts` is the package's barrel of blocks, not a block.
  if (top === 'blocks' && second && !second.endsWith('.ts')) {
    return { kind: 'block', name: second };
  }
  return null;
}

/** The layer a `@synapcity/frontend-ui/<subpath>` import points at. */
function layerOfSpecifier(subpath: string): Layer | null {
  const [top, second] = subpath.split('/');
  if (top === 'lib' || top === 'hooks') return { kind: 'lib' };
  if (top === 'core') return { kind: 'core' };
  // `components/ui/<name>` is the long spelling of `core/<name>`.
  if (top === 'components') {
    return second === 'ui' ? { kind: 'core' } : { kind: 'components' };
  }
  if (top === 'blocks') return { kind: 'block', name: second ?? '*' };
  return null;
}

function allowed(from: Layer, to: Layer): boolean {
  if (from.kind === 'block' && to.kind === 'block') {
    if (from.name === to.name) return true;
    return COMPOSITE_BLOCKS.has(from.name) && !COMPOSITE_BLOCKS.has(to.name);
  }
  return LAYER_RANK[to.kind] <= LAYER_RANK[from.kind];
}

describe('component folders', () => {
  const folders = componentFolders();

  it('finds the components', () => {
    expect(folders.length).toBeGreaterThan(30);
  });

  it.each(folders.map((folder) => [rel(folder), folder]))(
    '%s has its component, index, stories and tests',
    (_name, folder) => {
      const name = folder.split('/').at(-1)!;

      for (const file of [
        `${name}.tsx`,
        'index.ts',
        `${name}.stories.tsx`,
        `${name}.test.tsx`,
      ]) {
        expect(existsSync(join(folder, file)), `${rel(folder)}/${file}`).toBe(
          true,
        );
      }
    },
  );

  it('leaves no component file loose beside its siblings', () => {
    const loose: string[] = [];
    for (const base of COMPONENT_ROOTS) {
      for (const name of list(join(src, base))) {
        if (/\.tsx$/.test(name)) loose.push(`${base}/${name}`);
      }
    }

    expect(loose).toEqual([]);
  });

  it('keeps an index in every component folder free of logic', () => {
    for (const folder of folders) {
      const text = readFileSync(join(folder, 'index.ts'), 'utf8');
      const lines = text.split('\n').filter((line) => line.trim() !== '');

      expect(
        lines.every(
          (line) =>
            /^export /.test(line) ||
            /^\s|^\}/.test(line) ||
            /^import /.test(line),
        ),
        rel(folder),
      ).toBe(true);
    }
  });
});

describe('imports', () => {
  const files = sourceFiles();
  const importPattern = /\bfrom\s+['"]([^'"]+)['"]/g;

  const importsOf = (file: string) =>
    [...readFileSync(file, 'utf8').matchAll(importPattern)].map(
      (match) => match[1]!,
    );

  it('uses package paths across folders; relative paths only to siblings', () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const specifier of importsOf(file)) {
        if (!specifier.startsWith('.')) continue;
        // A file in the same folder, such as `./button` or `./entity-icons`.
        // Anything that climbs (`../`) or descends (`./parts/x`) crosses a
        // module boundary and goes through the package path instead.
        if (/^\.\/[\w.-]+$/.test(specifier)) continue;
        offenders.push(`${rel(file)} -> ${specifier}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('uses no path alias such as `@/`', () => {
    const offenders = files.flatMap((file) =>
      importsOf(file)
        .filter((specifier) => specifier.startsWith('@/'))
        .map((specifier) => `${rel(file)} -> ${specifier}`),
    );

    expect(offenders).toEqual([]);
  });

  it('never imports the index of the folder a file sits in', () => {
    const offenders: string[] = [];
    for (const file of files) {
      // Tests and stories import their component the way a consumer does;
      // nothing imports them back, so they cannot close a cycle.
      if (/\/index\.ts$|\.(test|stories)\.tsx?$/.test(file)) continue;
      for (const specifier of importsOf(file)) {
        if (!specifier.startsWith(`${pkg.name}/`)) continue;
        const target = resolveExport(specifier);
        if (!target?.endsWith('/index.ts')) continue;
        if (file.startsWith(target.slice(0, -'index.ts'.length))) {
          offenders.push(`${rel(file)} -> ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('only imports down the layers', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const from = layerOfFile(rel(file));
      if (!from) continue;
      for (const specifier of importsOf(file)) {
        if (!specifier.startsWith(`${pkg.name}/`)) continue;
        const to = layerOfSpecifier(specifier.slice(pkg.name.length + 1));
        if (!to || allowed(from, to)) continue;
        offenders.push(`${rel(file)} -> ${specifier}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('only imports package paths that resolve to a file', () => {
    const unresolved: string[] = [];
    for (const file of files) {
      for (const specifier of importsOf(file)) {
        if (!specifier.startsWith(`${pkg.name}/`)) continue;
        const target = resolveExport(specifier);
        if (!target || !existsSync(target)) {
          unresolved.push(`${rel(file)} -> ${specifier}`);
        }
      }
    }

    expect(unresolved).toEqual([]);
  });
});

describe('package.json exports', () => {
  it('points every fixed entry at a file', () => {
    for (const [key, target] of Object.entries(pkg.exports)) {
      if (key.includes('*')) continue;
      expect(existsSync(join(root, target)), `${key} -> ${target}`).toBe(true);
    }
  });

  it('resolves every component folder through its wildcard entry', () => {
    const prefixes: Record<string, string> = {
      components: './components/',
      'components/ui': './core/',
      blocks: './blocks/',
      next: './next/',
    };

    for (const base of COMPONENT_ROOTS) {
      for (const name of dirs(join(src, base))) {
        if (base === 'components' && name === 'ui') continue;
        const subpath = `${prefixes[base]}${name}`.slice(1);
        const target = resolveExport(`${pkg.name}${subpath}`);

        expect(target, `${base}/${name}`).not.toBeNull();
        expect(existsSync(target!), `${base}/${name} -> ${target}`).toBe(true);
      }
    }
  });

  it('exposes the non-component folders as flat modules', () => {
    for (const [dir, key] of [
      ['lib', 'lib'],
      ['hooks', 'hooks'],
    ] as const) {
      for (const file of list(join(src, dir))) {
        if (!file.endsWith('.ts')) continue;
        const specifier = `${pkg.name}/${key}/${file.replace(/\.ts$/, '')}`;
        const target = resolveExport(specifier);

        expect(target, specifier).not.toBeNull();
        expect(existsSync(target!), specifier).toBe(true);
      }
    }
  });
});
