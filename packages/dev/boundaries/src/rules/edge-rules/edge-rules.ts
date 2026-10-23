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
/** Domain entries frontend packages may import (ADR-0014: contracts and pure rules; owner decision 2026-10-23). */
const FRONTEND_DOMAIN_ENTRIES = ['', '/contracts', '/rules'];
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
              ? { kind: 'unscanned', path: resolution.path }
              : { kind: 'asset', path: resolution.path },
        });
      } else {
        edges.push({ from, record, target: resolution });
      }
    }
  }
  return { files, edges };
}

/** What follows the package name in a specifier (`@scope/name/rules` → `/rules`; the bare name → ''). */
function subpath(specifier: string, packageName: string): string {
  return specifier.startsWith(packageName)
    ? specifier.slice(packageName.length)
    : '';
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

interface Finding {
  rule: Violation['rule'];
  file: SourceFile;
  specifier: string;
  target: string | null;
  message: string;
}

/** What each rule function needs: where to send findings, and the workspace to read. */
interface Context {
  workspace: Workspace;
  rel: (path: string) => string;
  report: (finding: Finding) => void;
}

const isRelative = (specifier: string) =>
  specifier.startsWith('.') || specifier.startsWith('/');

/** R0 (parse errors) and R6 (feature source placement): judged per file. */
function fileRules(files: Map<string, SourceFile>, { rel, report }: Context) {
  for (const file of files.values()) {
    if (file.parseError) {
      report({
        rule: 'R0',
        file,
        specifier: '',
        target: null,
        message: `does not parse: ${file.parseError}`,
      });
    }
    const segments = rel(file.path)
      .slice(rel(file.pkg.dir).length + 1)
      .split('/');
    if (
      file.pkg.category === 'features' &&
      file.production &&
      segments[0] === 'src' &&
      !FEATURE_FOLDERS.has(segments[1] ?? '')
    ) {
      report({
        rule: 'R6',
        file,
        specifier: '',
        target: null,
        message:
          'feature source must sit under contracts/, frontend/, server/ or testing/',
      });
    }
  }
}

/** R0 and R5: an import that did not resolve to a file the scan holds. */
function unresolvedRule(edge: Edge, { workspace, rel, report }: Context) {
  const { from, record, target } = edge;
  const specifier = record.specifier;
  if (!record.literal) {
    if (from.production) {
      report({
        rule: 'R0',
        file: from,
        specifier,
        target: null,
        message: 'dynamic import argument is not a string literal',
      });
    }
    return;
  }
  if (target.kind === 'unscanned') {
    report({
      rule: 'R0',
      file: from,
      specifier,
      target: null,
      message: `resolves to code the scan did not visit: ${rel(target.path)}`,
    });
    return;
  }
  const owner = workspaceOwner(workspace, specifier);
  report(
    owner
      ? {
          rule: 'R5',
          file: from,
          specifier,
          target: owner.name,
          message: `${owner.name} does not export this path; import a public entry listed in its exports`,
        }
      : {
          rule: 'R0',
          file: from,
          specifier,
          target: null,
          message: 'import does not resolve',
        },
  );
}

/** R4 (domain libraries) and R11 (Next.js behind ./next): imports of installed packages. */
function externalRules(
  { from, record }: Edge,
  name: string,
  { rel, report }: Context,
) {
  const specifier = record.specifier;
  if (
    from.graph === 'domain' &&
    from.production &&
    !DOMAIN_LIBRARIES.includes(name)
  ) {
    report({
      rule: 'R4',
      file: from,
      specifier,
      target: name,
      message: `domain may import only ${DOMAIN_LIBRARIES.join(', ')}`,
    });
  }
  // Frontend packages keep Next.js behind src/next/; a feature does so inside its frontend/ folder.
  const nextFolder =
    from.pkg.category === 'features' ? 'src/frontend/next/' : 'src/next/';
  const inNextFolder = rel(from.path).startsWith(
    `${rel(from.pkg.dir)}/${nextFolder}`,
  );
  if (
    (from.pkg.category === 'frontend' || from.graph === 'feature-frontend') &&
    from.production &&
    name === 'next' &&
    !inNextFolder
  ) {
    report({
      rule: 'R11',
      file: from,
      specifier,
      target: name,
      message: 'Next.js imports belong behind the ./next entry',
    });
  }
}

/** R2, R5 and R8 for an edge between two different workspaces. */
function crossPackageRules(
  { from, record }: Edge,
  to: SourceFile,
  toPath: string,
  { report }: Context,
) {
  const specifier = record.specifier;
  const finding = (rule: Finding['rule'], message: string): Finding => ({
    rule,
    file: from,
    specifier,
    target: toPath,
    message,
  });
  if (from.pkg.category === 'app' && to.pkg.category === 'app') {
    // Apps have no exports, so a relative path is the only way in; the finding is the app-to-app edge.
    if (from.production) report(finding('R2', 'apps never import another app'));
  } else if (isRelative(specifier)) {
    report(
      finding(
        'R5',
        'import another package through its exports, not a relative path',
      ),
    );
  } else if (from.production && !to.production) {
    report(finding('R8', PRODUCTION_IMPORTS_NON_PRODUCTION));
  } else if (
    from.production &&
    from.graph === 'frontend' &&
    to.graph === 'domain' &&
    !FRONTEND_DOMAIN_ENTRIES.includes(subpath(specifier, to.pkg.name))
  ) {
    report(
      finding(
        'R2',
        `frontend may import domain contracts and pure rules only: use ${to.pkg.name}, /contracts or /rules (ADR-0014 matrix)`,
      ),
    );
  } else if (
    from.production &&
    to.production &&
    !isAllowed(from.graph, to.graph)
  ) {
    report(
      finding(
        'R2',
        `${from.graph} may not import ${to.graph} (ADR-0014 matrix)`,
      ),
    );
  }
}

/** R6, R2 (feature graphs), R8 and R7 for an edge inside one workspace. */
function samePackageRules(
  { from, record }: Edge,
  to: SourceFile,
  toPath: string,
  { report }: Context,
) {
  const specifier = record.specifier;
  const finding = (rule: Finding['rule'], message: string): Finding => ({
    rule,
    file: from,
    specifier,
    target: toPath,
    message,
  });

  if (from.pkg.category === 'features' && from.production) {
    const r6 = featurePathViolation(from, to);
    if (r6) {
      report(finding('R6', r6));
    } else if (
      to.production &&
      from.graph !== to.graph &&
      !isAllowed(from.graph, to.graph)
    ) {
      report(
        finding(
          'R2',
          `${from.graph} may not import ${to.graph} (ADR-0014 matrix)`,
        ),
      );
    }
  }
  // A feature file importing testing/ is already R6.
  const featureTesting =
    from.pkg.category === 'features' && to.graph === 'testing';
  if (from.production && !to.production && !featureTesting) {
    report(finding('R8', PRODUCTION_IMPORTS_NON_PRODUCTION));
  }
  if (
    !from.pkg.legacy &&
    from.pkg.category !== 'app' &&
    isRelative(specifier) &&
    dirname(to.path) !== dirname(from.path) &&
    !INDEX_FILE.test(basename(to.path))
  ) {
    report(
      finding(
        'R7',
        'import another folder through its index.ts, not a file inside it',
      ),
    );
  }
}

/** R0, R1, R2, R4, R5, R6, R7, R8 and R11: rules judged one file or one import at a time. */
export function edgeRules(
  files: Map<string, SourceFile>,
  edges: Edge[],
  workspace: Workspace,
): Violation[] {
  const rel = (path: string) => repoPath(workspace.root, path);
  const violations: Violation[] = [];
  const context: Context = {
    workspace,
    rel,
    report: ({ rule, file, specifier, target, message }) =>
      violations.push({
        rule,
        file: rel(file.path),
        specifier,
        target,
        message,
      }),
  };

  fileRules(files, context);

  for (const edge of edges) {
    const { from, record, target } = edge;
    if (
      !record.literal ||
      target.kind === 'unresolved' ||
      target.kind === 'unscanned'
    ) {
      unresolvedRule(edge, context);
    } else if (target.kind === 'external') {
      externalRules(edge, target.name, context);
    } else if (target.kind === 'file') {
      const to = target.file;
      const toPath = rel(to.path);
      if (to.pkg.category === 'app' && from.pkg.category !== 'app') {
        context.report({
          rule: 'R1',
          file: from,
          specifier: record.specifier,
          target: toPath,
          message: 'packages never import app source',
        });
      } else if (to.pkg !== from.pkg) {
        crossPackageRules(edge, to, toPath, context);
      } else {
        samePackageRules(edge, to, toPath, context);
      }
    }
    // An asset edge is always allowed.
  }

  return violations.sort(byFileThenRule);
}
