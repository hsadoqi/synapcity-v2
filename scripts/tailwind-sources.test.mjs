import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/*
 * Tailwind generates a utility only if it finds the class name in a scanned file, and it does
 * not scan workspace packages on its own: each host lists them with `@source`. A package
 * missing from that list builds, lints and passes its own tests, while its utilities are
 * silently absent from the host's CSS. That is how `frontend-blocks` lost ActionsToolbar's
 * container queries and ModeToggle's icon swap in web and docs (audit FE-01).
 *
 * This checks, for each host, that every workspace package it renders is under one of its
 * `@source` paths, and that every `@source` path exists.
 * - web and docs render their workspace dependencies, followed transitively.
 * - Storybook renders the packages its `stories` globs load, and their dependencies.
 * - A package counts as rendering classes if a `.tsx` file in its `src` has a `className=`
 *   (for Storybook, story files count too, because Storybook renders them).
 * - `@source` lines in a workspace stylesheet the host imports count for the host, so a
 *   package that ships its own `@source` (as `frontend-ui` does) covers itself.
 *
 * Limits, so a pass is not read as more than it is:
 * - Only `.tsx` files are read for `className=`. A package whose Tailwind classes live only in
 *   `.ts` files (a `cva()` or `cn()` call, a class map) is not seen as rendering classes and is
 *   not required. No package is like that today; every package with classes has a `.tsx` that
 *   uses them.
 * - Packages are found in six folders: `apps`, and `packages/` `frontend`, `features`,
 *   `domain`, `server` and `dev`. Only `packages/frontend` and `packages/features` can be
 *   required. A package in any other folder is not in the map, so a dependency on it is
 *   silently not followed; add the folder here if the workspace gains one.
 * - Storybook's roots are the packages its `stories` globs name. Its own `package.json`
 *   dependencies are not roots, and a stories glob without `/src/` in its path does not
 *   resolve to a package and makes the test throw.
 * - It reads the files lexically, not with Tailwind's parser. A `@source` counts only as a
 *   plain quoted directory that contains the package's whole `src`: a glob (`../src/**`),
 *   a single file or a folder inside `src` does not count as covering the package, and a
 *   glob fails the "path exists" check. `@source not`, `@source inline()` and `source()` on
 *   `@import` are ignored, not modelled. Workspace stylesheets are followed only through an
 *   `@import` of `@synapcity/...` whose `exports` entry is a plain string.
 * - A class built at runtime from fragments is not generated even from a scanned file, and
 *   nothing here can see that.
 */

const repo = fileURLToPath(new URL('..', import.meta.url));

const PACKAGE_CATEGORIES = ['packages/frontend', 'packages/features'];

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** Every workspace package by name, so dependencies resolve without node_modules. */
const workspace = new Map(
  [
    'apps',
    'packages/frontend',
    'packages/features',
    'packages/domain',
    'packages/server',
    'packages/dev',
  ]
    .flatMap((category) =>
      readdirSync(join(repo, category), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(repo, category, entry.name)),
    )
    .filter((dir) => existsSync(join(dir, 'package.json')))
    .map((dir) => [readJson(join(dir, 'package.json')).name, dir]),
);

const workspaceDeps = (dir, fields) => {
  const manifest = readJson(join(dir, 'package.json'));
  return fields
    .flatMap((field) => Object.keys(manifest[field] ?? {}))
    .filter((name) => workspace.has(name));
};

/** The packages reachable from `roots` through runtime dependencies. */
const closure = (roots) => {
  const seen = new Set();
  const visit = (name) => {
    if (!seen || seen.has(name)) return;
    seen.add(name);
    for (const dep of workspaceDeps(workspace.get(name), [
      'dependencies',
      'peerDependencies',
    ])) {
      visit(dep);
    }
  };
  roots.forEach(visit);
  return seen;
};

const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => join(entry.parentPath, entry.name));

const rendersClasses = (dir, { stories }) => {
  const src = join(dir, 'src');
  if (!existsSync(src)) return false;
  return sourceFiles(src)
    .filter((file) => !/\.test\.tsx$/.test(file))
    .filter((file) => stories || !/\.stories\.tsx$/.test(file))
    .some((file) => readFileSync(file, 'utf8').includes('className='));
};

/** Resolves `@synapcity/x/sub.css` through the package's `exports`, or undefined. */
const resolveWorkspaceStylesheet = (specifier) => {
  const [scope, name, ...rest] = specifier.split('/');
  const dir = workspace.get(`${scope}/${name}`);
  if (!dir) return undefined;
  const target = readJson(join(dir, 'package.json')).exports?.[
    `./${rest.join('/')}`
  ];
  return typeof target === 'string' ? join(dir, target) : undefined;
};

/** The host's `@source` directories, including those of workspace stylesheets it imports. */
const sourcesOf = (file, seen = new Set()) => {
  if (seen.has(file)) return [];
  seen.add(file);
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const own = [...css.matchAll(/@source\s+(['"])([^'"]+)\1/g)].map((m) => ({
    declared: m[2],
    path: resolve(dirname(file), m[2]),
    file,
  }));
  const imported = [...css.matchAll(/@import\s+(['"])(@synapcity\/[^'"]+)\1/g)]
    .map((m) => resolveWorkspaceStylesheet(m[2]))
    .filter(Boolean)
    .flatMap((stylesheet) => sourcesOf(stylesheet, seen));
  return [...own, ...imported];
};

const isWithin = (child, parent) => {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};

/** Package directories named by Storybook's `stories` globs. */
const storybookPackages = () => {
  const mainDir = join(repo, 'apps/storybook/.storybook');
  const main = readFileSync(join(mainDir, 'main.ts'), 'utf8');
  return [...main.matchAll(/['"]([^'"]*\.stories\.[^'"]*)['"]/g)].map((m) =>
    resolve(mainDir, m[1].slice(0, m[1].indexOf('/src/'))),
  );
};

const nameOf = (dir) => [...workspace].find(([, d]) => d === dir)?.[0];

const HOSTS = [
  {
    host: 'web',
    entry: 'apps/web/src/styles/globals.css',
    roots: () =>
      workspaceDeps(join(repo, 'apps/web'), [
        'dependencies',
        'devDependencies',
      ]),
    stories: false,
  },
  {
    host: 'docs',
    entry: 'apps/docs/src/styles/globals.css',
    roots: () =>
      workspaceDeps(join(repo, 'apps/docs'), [
        'dependencies',
        'devDependencies',
      ]),
    stories: false,
  },
  {
    host: 'storybook',
    entry: 'apps/storybook/styles/globals.css',
    roots: () => storybookPackages().map(nameOf),
    stories: true,
  },
];

/** The rendering packages a host must scan, as directories. */
const requiredFor = ({ roots, stories }) => {
  const storyRoots = new Set(stories ? roots() : []);
  return [...closure(roots())]
    .map((name) => ({ name, dir: workspace.get(name) }))
    .filter(({ dir }) =>
      PACKAGE_CATEGORIES.some((category) =>
        isWithin(dir, join(repo, category)),
      ),
    )
    .filter(({ name, dir }) =>
      rendersClasses(dir, { stories: storyRoots.has(name) }),
    );
};

describe.each(HOSTS)('Tailwind sources of $host', (host) => {
  const sources = sourcesOf(join(repo, host.entry));
  const required = requiredFor(host);

  it('finds the packages and sources it checks', () => {
    // Guards against a scan that silently finds nothing and so passes.
    expect(sources.length).toBeGreaterThan(0);
    expect(required.map(({ name }) => name)).toContain(
      '@synapcity/frontend-ui',
    );
    expect(required.map(({ name }) => name)).toContain(
      '@synapcity/frontend-blocks',
    );
  });

  it('scans every workspace package it renders', () => {
    const uncovered = required
      .filter(
        ({ dir }) =>
          !sources.some((source) => isWithin(join(dir, 'src'), source.path)),
      )
      .map(({ name, dir }) => `${name} (${relative(repo, join(dir, 'src'))})`);

    expect(uncovered).toEqual([]);
  });

  it('has no @source path that does not exist', () => {
    const missing = sources
      .filter((source) => !existsSync(source.path))
      .map((source) => `${relative(repo, source.file)}: ${source.declared}`);

    expect(missing).toEqual([]);
  });
});
