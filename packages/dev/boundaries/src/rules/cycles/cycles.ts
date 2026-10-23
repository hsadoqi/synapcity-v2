import { relative, sep } from 'node:path';

import type { Edge, Violation, Workspace } from '../../model/index.ts';

/** Strongly connected components with more than one node, or a node with an edge to itself (Tarjan). */
function cycles(nodes: string[], next: (node: string) => string[]): string[][] {
  let counter = 0;
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const found: string[][] = [];

  const visit = (node: string) => {
    index.set(node, counter);
    low.set(node, counter);
    counter++;
    stack.push(node);
    onStack.add(node);
    for (const neighbour of next(node)) {
      if (!index.has(neighbour)) {
        visit(neighbour);
        low.set(node, Math.min(low.get(node)!, low.get(neighbour)!));
      } else if (onStack.has(neighbour)) {
        low.set(node, Math.min(low.get(node)!, index.get(neighbour)!));
      }
    }
    if (low.get(node) === index.get(node)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
      } while (member !== node);
      if (component.length > 1 || next(node).includes(node))
        found.push(component.sort());
    }
  };

  for (const node of nodes) if (!index.has(node)) visit(node);
  return found;
}

/** R9: no cycles in the package graph (all workspace dependencies) or the module graph (including type imports). */
export function cycleRule(workspace: Workspace, edges: Edge[]): Violation[] {
  const rel = (path: string) =>
    relative(workspace.root, path).split(sep).join('/');
  const violations: Violation[] = [];

  const byName = new Map(workspace.packages.map((pkg) => [pkg.name, pkg]));
  const packageNames = [...byName.keys()].sort();
  for (const component of cycles(packageNames, (name) =>
    (byName.get(name)?.dependencies ?? []).filter((dependency) =>
      byName.has(dependency),
    ),
  )) {
    violations.push({
      rule: 'R9',
      file: `${rel(byName.get(component[0]!)!.dir)}/package.json`,
      specifier: '',
      target: null,
      message: `package dependency cycle: ${component.join(' -> ')}`,
    });
  }

  const outgoing = new Map<string, Set<string>>();
  for (const { from, target } of edges) {
    if (target.kind !== 'file') continue;
    const set = outgoing.get(rel(from.path)) ?? new Set<string>();
    set.add(rel(target.file.path));
    outgoing.set(rel(from.path), set);
  }
  const modules = [...outgoing.keys()].sort();
  for (const component of cycles(modules, (module) =>
    [...(outgoing.get(module) ?? [])].sort(),
  )) {
    violations.push({
      rule: 'R9',
      file: component[0]!,
      specifier: '',
      target: null,
      message: `module cycle: ${component.join(' -> ')}`,
    });
  }
  return violations.sort((a, b) => a.file.localeCompare(b.file));
}
