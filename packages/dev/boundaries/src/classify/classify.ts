import type { Graph, WorkspacePackage } from '../model/index.ts';

type Directive = 'use client' | 'use server' | null;

const FEATURE_GRAPHS: Record<string, Graph> = {
  contracts: 'feature-contracts',
  frontend: 'feature-frontend',
  server: 'feature-server',
  testing: 'testing',
};

const TEST_OR_STORY = /\.(test|dom\.test|stories)\.[cm]?[jt]sx?$/;
const CONFIG = /\.config\.[cm]?[jt]sx?$/;
const NON_PRODUCTION_HOSTS = new Set(['storybook']);

function isNonProductionPath(relative: string, pkg: WorkspacePackage): boolean {
  const segments = relative.split('/');
  const base = segments.at(-1) ?? '';
  return (
    TEST_OR_STORY.test(base) ||
    CONFIG.test(base) ||
    segments.includes('e2e') ||
    segments.includes('.storybook') ||
    (pkg.category === 'app' && NON_PRODUCTION_HOSTS.has(pkg.name))
  );
}

/** A file's dependency graph and whether it ships, from its path (workspace conventions, Boundary checks). */
export function classifyFile(
  path: string,
  pkg: WorkspacePackage,
  directive: Directive,
): { graph: Graph; production: boolean } {
  const relative = path.slice(pkg.dir.length + 1);
  const segments = relative.split('/');
  let graph: Graph;

  if (pkg.category === 'dev') {
    graph = 'dev';
  } else if (pkg.category === 'app') {
    graph = directive === 'use client' ? 'app-browser' : 'app-backend';
  } else if (segments[0] === 'src' && segments[1] === 'testing') {
    graph = 'testing';
  } else if (pkg.category === 'features') {
    // A feature file outside the four entry folders is reported by R6; it is held to the strictest graph here.
    graph =
      (segments[0] === 'src' && FEATURE_GRAPHS[segments[1] ?? '']) ||
      'feature-contracts';
  } else {
    graph = pkg.category;
  }

  const production =
    graph !== 'dev' &&
    graph !== 'testing' &&
    !isNonProductionPath(relative, pkg);
  return { graph, production };
}
