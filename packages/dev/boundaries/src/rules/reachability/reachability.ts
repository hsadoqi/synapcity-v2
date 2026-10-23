import { relative, sep } from 'node:path';

import type {
  Edge,
  Graph,
  SourceFile,
  Violation,
  Workspace,
} from '../../model/index.ts';

/** App modules that only the server may load (prefix match on repository-relative paths). */
export const APP_SERVER_ONLY = [
  'apps/web/src/lib/supabase/server.ts',
  'apps/web/src/lib/supabase/middleware.ts',
  'apps/web/src/lib/access/',
];

/** npm modules that only the server may load. */
const SERVER_ONLY_MODULES = ['next/headers', 'server-only'];

const BROWSER_GRAPHS = new Set<Graph>([
  'frontend',
  'feature-frontend',
  'feature-contracts',
  'app-browser',
]);
const SERVER_GRAPHS = new Set<Graph>(['server', 'feature-server']);

/**
 * R3: no server code is reachable, directly or transitively, from browser-reachable code. Follows value
 * edges only (type imports are erased) and does not enter `'use server'` files, which Next replaces with
 * a reference in the client bundle.
 */
export function reachabilityRule(
  files: Map<string, SourceFile>,
  edges: Edge[],
  workspace: Workspace,
): Violation[] {
  const rel = (path: string) =>
    relative(workspace.root, path).split(sep).join('/');
  const outgoing = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (edge.record.typeOnly) continue;
    const list = outgoing.get(edge.from.path) ?? [];
    list.push(edge);
    outgoing.set(edge.from.path, list);
  }

  const forbiddenFile = (file: SourceFile) =>
    SERVER_GRAPHS.has(file.graph) ||
    APP_SERVER_ONLY.some((prefix) => rel(file.path).startsWith(prefix));
  const forbiddenModule = (specifier: string) =>
    SERVER_ONLY_MODULES.some(
      (module) => specifier === module || specifier.startsWith(`${module}/`),
    );

  const violations: Violation[] = [];
  for (const source of files.values()) {
    if (!source.production || !BROWSER_GRAPHS.has(source.graph)) continue;
    const via = new Map<string, string | null>([[source.path, null]]);
    const queue = [source.path];
    const reported = new Set<string>();
    const chain = (path: string) => {
      const steps: string[] = [];
      for (let step: string | null = path; step; step = via.get(step) ?? null)
        steps.unshift(rel(step));
      return steps.join(' -> ');
    };
    const report = (target: string, specifier: string, through: string) => {
      if (reported.has(target)) return;
      reported.add(target);
      violations.push({
        rule: 'R3',
        file: rel(source.path),
        specifier,
        target,
        message: `browser-reachable code reaches server code: ${chain(through)} -> ${target}`,
      });
    };

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const { record, target } of outgoing.get(current) ?? []) {
        if (target.kind === 'external' && forbiddenModule(record.specifier)) {
          report(record.specifier, record.specifier, current);
        } else if (target.kind === 'file') {
          const next = target.file;
          if (forbiddenFile(next))
            report(rel(next.path), record.specifier, current);
          else if (next.directive !== 'use server' && !via.has(next.path)) {
            via.set(next.path, current);
            queue.push(next.path);
          }
        }
      }
    }
  }
  return violations.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      (a.target ?? '').localeCompare(b.target ?? ''),
  );
}
