import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';

import { classifyFile } from '../../classify/index.ts';
import { readModule } from '../../imports/index.ts';
import { isAllowed } from '../../matrix/index.ts';
import type {
  Edge,
  SourceFile,
  Violation,
  Workspace,
  WorkspacePackage,
} from '../../model/index.ts';
import { repoPath, byFileThenRule } from '../../paths/index.ts';
import { createResolver } from '../../resolve/index.ts';
import { listSourceFiles } from '../../workspace/index.ts';

/** Platform-independent libraries domain code may import (R4). */
export const DOMAIN_LIBRARIES = ['zod'];

const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const INDEX_FILE = /^index\.[cm]?[jt]sx?$/;
const FEATURE_FOLDERS = new Set(['contracts', 'frontend', 'server', 'testing']);
const DECLARATION_FILE = /\.d\.[cm]?ts$/;
const PRODUCTION_IMPORTS_NON_PRODUCTION =
  'production code never imports dev, testing, test or story code';

/** Every source file in the workspace, classified, and every import edge, resolved. */
export function buildEdges(workspace: Workspace): {
  files: Map<string, SourceFile>;
  edges: Edge[];
} {
  const resolve = createResolver(workspace);
  const files = new Map<string, SourceFile>();
  for (const pkg of workspace.packages) {
    for (const path of listSourceFiles(pkg)) {
      const read = readModule(path, readFileSync(path, 'utf8'));
      files.set(path, {
        path,
        pkg,
        ...classifyFile(path, pkg, read.directive),
        ...read,
      });
    }
  }
  const edges: Edge[] = [];
  for (const from of files.values()) {
    for (const record of from.imports) {
      if (!record.literal) {
        edges.push({ from, record, target: { kind: 'unresolved' } });
        continue;
      }
      const resolution = resolve(from.path, record.specifier, record.typeOnly);
      if (resolution.kind === 'path') {
        const isCode =
          SOURCE_FILE.test(resolution.path) &&
          !DECLARATION_FILE.test(resolution.path);
        const file = isCode ? files.get(resolution.path) : undefined;
        edges.push({
          from,
          record,
          // Code the scan did not visit (build output, an unknown folder) must not pass as an asset.
          target: file
            ? { kind: 'file', file }
            : isCode
              ? { kind: 'unresolved' }
              : { kind: 'asset', path: resolution.path },
        });
      } else {
        edges.push({ from, record, target: resolution });
      }
    }
  }
  return { files, edges };
}

/** The workspace package a bare specifier with a subpath names (`@scope/name/deep`), if any. */
function workspaceOwner(
  workspace: Workspace,
  specifier: string,
): WorkspacePackage | undefined {
  if (specifier.startsWith('.') || specifier.startsWith('/')) return undefined;
  const parts = specifier.split('/');
  const name = specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0];
  return name === specifier
    ? undefined
    : workspace.packages.find((pkg) => pkg.name === name);
}

/** R6: the feature path rule an edge between two files of one feature package breaks, if any. */
function featurePathViolation(from: SourceFile, to: SourceFile): string | null {
  if (
    to.graph === 'feature-server' &&
    (from.graph === 'feature-frontend' || from.graph === 'feature-contracts')
  )
    return `${from.graph} never imports feature server code`;
  if (to.graph === 'feature-frontend' && from.graph === 'feature-contracts')
    return 'feature contracts never import feature frontend code';
  if (to.graph === 'testing') return 'only testing/ imports testing/';
  return null;
}

/** R0, R1, R2, R4, R5, R6, R7, R8 and R11: rules judged one file or one import at a time. */
export function edgeRules(
  files: Map<string, SourceFile>,
  edges: Edge[],
  workspace: Workspace,
): Violation[] {
  const rel = (path: string) => repoPath(workspace.root, path);
  const violations: Violation[] = [];
  const report = (
    rule: Violation['rule'],
    file: SourceFile,
    specifier: string,
    target: string | null,
    message: string,
  ) =>
    violations.push({ rule, file: rel(file.path), specifier, target, message });

  for (const file of files.values()) {
    if (file.parseError)
      report('R0', file, '', null, `does not parse: ${file.parseError}`);
    const segments = rel(file.path)
      .slice(rel(file.pkg.dir).length + 1)
      .split('/');
    if (
      file.pkg.category === 'features' &&
      file.production &&
      segments[0] === 'src' &&
      !FEATURE_FOLDERS.has(segments[1] ?? '')
    ) {
      report(
        'R6',
        file,
        '',
        null,
        'feature source must sit under contracts/, frontend/, server/ or testing/',
      );
    }
  }

  for (const { from, record, target } of edges) {
    const specifier = record.specifier;
    if (!record.literal) {
      if (from.production)
        report(
          'R0',
          from,
          specifier,
          null,
          'dynamic import argument is not a string literal',
        );
      continue;
    }
    if (target.kind === 'unresolved') {
      const owner = workspaceOwner(workspace, specifier);
      if (owner) {
        report(
          'R5',
          from,
          specifier,
          owner.name,
          `${owner.name} does not export this path; import a public entry listed in its exports`,
        );
      } else {
        report('R0', from, specifier, null, 'import does not resolve');
      }
      continue;
    }
    if (target.kind === 'unscanned') {
      report(
        'R0',
        from,
        specifier,
        null,
        `resolves to code the scan did not visit: ${rel(target.path)}`,
      );
      continue;
    }
    if (target.kind === 'asset') continue;

    if (target.kind === 'external') {
      if (
        from.graph === 'domain' &&
        from.production &&
        !DOMAIN_LIBRARIES.includes(target.name)
      ) {
        report(
          'R4',
          from,
          specifier,
          target.name,
          `domain may import only ${DOMAIN_LIBRARIES.join(', ')}`,
        );
      }
      const inNextFolder = rel(from.path).startsWith(
        `${rel(from.pkg.dir)}/src/next/`,
      );
      if (
        from.pkg.category === 'frontend' &&
        from.production &&
        target.name === 'next' &&
        !inNextFolder
      ) {
        report(
          'R11',
          from,
          specifier,
          target.name,
          'Next.js imports belong behind the ./next entry',
        );
      }
      continue;
    }

    const to = target.file;
    const toPath = rel(to.path);
    if (to.pkg.category === 'app' && from.pkg.category !== 'app') {
      report('R1', from, specifier, toPath, 'packages never import app source');
      continue;
    }

    if (to.pkg !== from.pkg) {
      if (from.pkg.category === 'app' && to.pkg.category === 'app') {
        // Apps have no exports, so a relative path is the only way in; the finding is the app-to-app edge.
        if (from.production) {
          report(
            'R2',
            from,
            specifier,
            toPath,
            'apps never import another app',
          );
        }
      } else if (specifier.startsWith('.') || specifier.startsWith('/')) {
        report(
          'R5',
          from,
          specifier,
          toPath,
          'import another package through its exports, not a relative path',
        );
      } else if (from.production && !to.production) {
        report(
          'R8',
          from,
          specifier,
          toPath,
          PRODUCTION_IMPORTS_NON_PRODUCTION,
        );
      } else if (
        from.production &&
        to.production &&
        !isAllowed(from.graph, to.graph)
      ) {
        report(
          'R2',
          from,
          specifier,
          toPath,
          `${from.graph} may not import ${to.graph} (ADR-0014 matrix)`,
        );
      }
      continue;
    }

    // Same package: the feature path rules (R6), test or story imports (R8), then the folder-import rule (R7).
    if (from.pkg.category === 'features' && from.production) {
      const r6 = featurePathViolation(from, to);
      if (r6) {
        report('R6', from, specifier, toPath, r6);
      } else if (
        to.production &&
        from.graph !== to.graph &&
        !isAllowed(from.graph, to.graph)
      ) {
        report(
          'R2',
          from,
          specifier,
          toPath,
          `${from.graph} may not import ${to.graph} (ADR-0014 matrix)`,
        );
      }
    }
    // A feature file importing testing/ is already R6.
    const featureTesting =
      from.pkg.category === 'features' && to.graph === 'testing';
    if (from.production && !to.production && !featureTesting) {
      report('R8', from, specifier, toPath, PRODUCTION_IMPORTS_NON_PRODUCTION);
    }
    if (
      !from.pkg.legacy &&
      from.pkg.category !== 'app' &&
      specifier.startsWith('.') &&
      dirname(to.path) !== dirname(from.path) &&
      !INDEX_FILE.test(basename(to.path))
    ) {
      report(
        'R7',
        from,
        specifier,
        toPath,
        'import another folder through its index.ts, not a file inside it',
      );
    }
  }

  return violations.sort(byFileThenRule);
}
