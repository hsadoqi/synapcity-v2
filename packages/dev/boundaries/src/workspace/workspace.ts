import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Category, Workspace, WorkspacePackage } from '../model/index.ts';

const CATEGORIES = new Set<Category>([
  'domain',
  'frontend',
  'server',
  'features',
  'dev',
]);

/** Existing packages that keep their own layout (workspace conventions, Internal organization). */
const LEGACY = new Set([
  '@synapcity/frontend-ui',
  '@synapcity/frontend-site',
  '@synapcity/frontend-tailwind-config',
]);

const SOURCE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
];
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  '.next',
  'dist',
  'coverage',
  '.turbo',
  'storybook-static',
  'playwright-report',
  'test-results',
]);

type Manifest = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  exports?: unknown;
};

function subdirectories(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(dir, entry.name));
}

/** The first string target of an `exports` value: a string, or the first string in a conditions object. */
function firstTarget(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      const target = firstTarget(nested);
      if (target) return target;
    }
  }
  return null;
}

function flattenExports(exports: unknown): Record<string, string> {
  if (typeof exports === 'string') return { '.': exports };
  const flat: Record<string, string> = {};
  if (exports && typeof exports === 'object') {
    for (const [key, value] of Object.entries(exports)) {
      const target = firstTarget(value);
      if (target) flat[key] = target;
    }
  }
  return flat;
}

function readPackage(dir: string, category: Category): WorkspacePackage | null {
  const manifestPath = join(dir, 'package.json');
  if (!existsSync(manifestPath)) return null;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
  const name = manifest.name ?? dir;
  const declared = { ...manifest.dependencies, ...manifest.devDependencies };
  const tsconfig = join(dir, 'tsconfig.json');
  return {
    name,
    dir,
    category,
    legacy: LEGACY.has(name) || name.startsWith('@synapcity/dev-'),
    dependencies: Object.entries(declared)
      .filter(([, range]) => range.startsWith('workspace:'))
      .map(([dependency]) => dependency),
    exports: flattenExports(manifest.exports),
    tsconfig: existsSync(tsconfig) ? tsconfig : null,
  };
}

/** Workspaces at `apps/<name>` and `packages/<category>/<name>`. */
export function loadWorkspace(root: string): Workspace {
  const packages: WorkspacePackage[] = [];
  for (const dir of subdirectories(join(root, 'apps'))) {
    const pkg = readPackage(dir, 'app');
    if (pkg) packages.push(pkg);
  }
  for (const categoryDir of subdirectories(join(root, 'packages'))) {
    const category = categoryDir.slice(
      categoryDir.lastIndexOf('/') + 1,
    ) as Category;
    if (!CATEGORIES.has(category)) continue;
    for (const dir of subdirectories(categoryDir)) {
      const pkg = readPackage(dir, category);
      if (pkg) packages.push(pkg);
    }
  }
  return { root, packages };
}

/** Every source file in a package, absolute, excluding generated, installed and declaration files. */
export function listSourceFiles(pkg: WorkspacePackage): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) walk(full);
      } else if (
        entry.isFile() &&
        SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension)) &&
        !/\.d\.[mc]?ts$/.test(entry.name)
      ) {
        files.push(full);
      }
    }
  };
  walk(pkg.dir);
  return files.sort();
}
