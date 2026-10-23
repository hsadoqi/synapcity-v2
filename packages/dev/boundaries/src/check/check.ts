import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { EXCEPTIONS, applyExceptions } from '../exceptions/index.ts';
import type { Exception, Violation } from '../model/index.ts';
import type { SourceFile } from '../model/index.ts';
import { cycleRule } from '../rules/cycles/index.ts';
import { buildEdges, edgeRules } from '../rules/edge-rules/index.ts';
import { byFileThenRule, repoPath } from '../paths/index.ts';
import { reachabilityRule } from '../rules/reachability/index.ts';
import { serverGuardRule } from '../rules/server-guard/index.ts';
import { loadWorkspace } from '../workspace/index.ts';

export interface CheckResult {
  violations: Violation[];
  stale: Exception[];
  /** Source files found per package name. */
  fileCounts: Record<string, number>;
}

/**
 * Runs every boundary rule over the workspace at `root` and applies the exception list. `appServerOnly` names
 * the app modules only the server may load (R3); each entry must match a scanned file, so a rename cannot
 * disarm the rule silently. It is empty by default because the list is specific to the Synapcity repository.
 */
export function check(
  root: string,
  exceptions: readonly Exception[] = EXCEPTIONS,
  appServerOnly: readonly string[] = [],
): CheckResult {
  const workspace = loadWorkspace(root);
  const { files, edges } = buildEdges(workspace);

  const fileCounts: Record<string, number> = {};
  for (const pkg of workspace.packages) fileCounts[pkg.name] = 0;
  for (const file of files.values())
    fileCounts[file.pkg.name] = (fileCounts[file.pkg.name] ?? 0) + 1;
  for (const pkg of workspace.packages) {
    if (fileCounts[pkg.name] === 0 && existsSync(join(pkg.dir, 'src'))) {
      throw new Error(
        `boundaries: no source files found in ${pkg.name}; the scan would pass silently`,
      );
    }
  }

  const violations = [
    ...edgeRules(files, edges, workspace),
    ...reachabilityRule(files, edges, workspace, appServerOnly),
    ...staleServerOnly(files, workspace.root, appServerOnly),
    ...cycleRule(workspace, edges),
    ...serverGuardRule(files, workspace),
  ].sort(byFileThenRule);

  const { remaining, stale } = applyExceptions(violations, exceptions);
  return { violations: remaining, stale, fileCounts };
}

/** R3: an app server-only entry that matches no scanned file is a stale name, and the rule would guard nothing. */
function staleServerOnly(
  files: Map<string, SourceFile>,
  root: string,
  appServerOnly: readonly string[],
): Violation[] {
  const scanned = [...files.keys()].map((path) => repoPath(root, path));
  return appServerOnly
    .filter((entry) => !scanned.some((path) => path.startsWith(entry)))
    .map((entry) => ({
      rule: 'R3' as const,
      file: entry,
      specifier: '',
      target: null,
      message: 'app server-only path matches no scanned file; update the list',
    }));
}
