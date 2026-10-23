import { realpathSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname } from 'node:path';

import { ResolverFactory } from 'oxc-resolver';

import type { Workspace, WorkspacePackage } from '../model/index.ts';

export type Resolution =
  | { kind: 'path'; path: string }
  | { kind: 'external'; name: string }
  | { kind: 'unresolved' };

const EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
];
const BUILTINS = new Set(builtinModules);

/** `@scope/name/deep` → `@scope/name`; `name/deep` → `name`. */
function packageName(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : (parts[0] ?? specifier);
}

function isInside(path: string, dir: string): boolean {
  return path === dir || path.startsWith(`${dir}/`);
}

/** Resolves imports the way the toolchain does: each file with its own workspace's tsconfig and `exports`. */
export function createResolver(
  workspace: Workspace,
): (fromFile: string, specifier: string) => Resolution {
  const resolvers = new Map<WorkspacePackage | null, ResolverFactory>();
  const owner = (file: string) =>
    workspace.packages.find((pkg) => isInside(file, pkg.dir)) ?? null;
  const resolverFor = (pkg: WorkspacePackage | null) => {
    let resolver = resolvers.get(pkg);
    if (!resolver) {
      resolver = new ResolverFactory({
        ...(pkg?.tsconfig
          ? {
              tsconfig: {
                configFile: pkg.tsconfig,
                references: 'auto' as const,
              },
            }
          : {}),
        conditionNames: ['import', 'default'],
        extensions: EXTENSIONS,
        extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
        mainFields: ['module', 'main'],
      });
      resolvers.set(pkg, resolver);
    }
    return resolver;
  };

  return (fromFile, specifier) => {
    if (specifier.startsWith('node:') || BUILTINS.has(specifier))
      return { kind: 'external', name: specifier };
    // A symlinked path would miss its owning package and that package's tsconfig.
    const from = realpathSync(fromFile);
    const result = resolverFor(owner(from)).sync(dirname(from), specifier);
    if (!result.path) return { kind: 'unresolved' };
    // Workspace packages resolve to their real directories, so an installed dependency is anything under node_modules.
    if (
      result.path.includes('/node_modules/') ||
      !isInside(result.path, workspace.root)
    ) {
      return { kind: 'external', name: packageName(specifier) };
    }
    return { kind: 'path', path: result.path };
  };
}
