import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
 * The package's layout contract, enforced rather than remembered (the same
 * contract `frontend-ui` and `frontend-shells` follow; the components carried it
 * in `frontend-ui` before they moved here):
 *
 * - every component is a folder named after it, holding the component, its
 *   stories, its tests and an index that is the folder's public surface;
 * - no component file sits loose beside its siblings in `components/`;
 * - the `exports` entry resolves to a real file.
 *
 * A unit folder holds `<folder>/<folder>.tsx`. It is a component folder unless
 * that file exports only SCREAMING_CASE constants and types: such a `.tsx`
 * module is data (`data/`, demo constants holding icon elements) and needs no
 * story.
 *
 * Not covered yet: the workbench prototype's loose files in `main-content/`,
 * `main-header/`, `main-sidebar/`, `sidebar-rail/` and `src/` itself. Whether
 * they take this contract is open.
 */

const root = join(import.meta.dirname, '..');
const src = join(root, 'src');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, string>;
};

const list = (dir: string) => readdirSync(dir).sort();
// Hidden folders (editor or tool state such as `.claude/`) are never units.
const dirs = (dir: string) =>
  list(dir).filter(
    (name) => !name.startsWith('.') && statSync(join(dir, name)).isDirectory(),
  );

const rel = (path: string) => relative(src, path);
const nameOf = (folder: string) => folder.split('/').at(-1)!;

/** Every folder that holds `<folder>/<folder>.tsx`, at any depth. */
function unitFolders(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of dirs(dir)) {
      const path = join(dir, name);
      if (existsSync(join(path, `${name}.tsx`))) found.push(path);
      walk(path);
    }
  };
  walk(src);
  return found;
}

// Exports that make a module data rather than a component: SCREAMING_CASE
// constants (`WORKSPACES`) and types.
const DATA_EXPORT =
  /^export\s+(?:const\s+[A-Z][A-Z0-9_]*\b|type\b|interface\b)/;

/** A component unless every export is data, so an unusual export never exempts one. */
const exportsComponent = (folder: string) => {
  const text = readFileSync(join(folder, `${nameOf(folder)}.tsx`), 'utf8');
  const exported = text.match(/^export\b.*$/gm) ?? [];
  return !exported.every((line) => DATA_EXPORT.test(line));
};

describe('component folders', () => {
  const folders = unitFolders().filter(exportsComponent);

  it('finds the components', () => {
    // A silent scan would pass every rule below.
    expect(folders.map(rel)).toContain('components/day-agenda');
  });

  it('has its component, index, stories and tests in every folder', () => {
    const missing: string[] = [];
    for (const folder of folders) {
      const name = nameOf(folder);
      for (const file of [
        'index.ts',
        `${name}.stories.tsx`,
        `${name}.test.tsx`,
      ]) {
        if (!existsSync(join(folder, file))) {
          missing.push(`${rel(folder)}/${file}`);
        }
      }
    }

    expect(
      missing,
      'Each component folder needs these files; add them beside the component.',
    ).toEqual([]);
  });

  it('leaves no component file loose beside its siblings in components/', () => {
    const loose = list(join(src, 'components'))
      .filter((name) => /\.tsx$/.test(name))
      .map((name) => `components/${name}`);

    expect(
      loose,
      'Move each into its own folder: components/<name>/<name>.tsx with index, stories and tests.',
    ).toEqual([]);
  });

  it('gives every unit folder an index', () => {
    const missing = unitFolders()
      .filter((folder) => !existsSync(join(folder, 'index.ts')))
      .map((folder) => `${rel(folder)}/index.ts`);

    expect(missing).toEqual([]);
  });
});

describe('package.json exports', () => {
  it('points every entry at a file', () => {
    for (const [key, target] of Object.entries(pkg.exports)) {
      expect(existsSync(join(root, target)), `${key} -> ${target}`).toBe(true);
    }
  });
});
