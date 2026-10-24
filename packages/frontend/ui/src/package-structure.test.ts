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
 * - every such specifier, and every `exports` entry, resolves to a real file.
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
  'providers',
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
      providers: './providers/',
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
      ['utils', 'utils'],
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
