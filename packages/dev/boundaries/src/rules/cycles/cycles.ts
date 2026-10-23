import type { Edge, Violation, Workspace } from '../../model/index.ts';
import { repoPath } from '../../paths/index.ts';

/** Strongly connected components with more than one node, or a node with an edge to itself (Tarjan). */
function cycles(
  nodes: string[],
  neighbours: (node: string) => string[],
): string[][] {
  const cache = new Map<string, string[]>();
  const next = (node: string) => {
    let list = cache.get(node);
    if (!list) cache.set(node, (list = neighbours(node)));
    return list;
  };
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
  const rel = (path: string) => repoPath(workspace.root, path);
  const violations: Violation[] = [];

  const byName = new Map(workspace.packages.map((pkg) => [pkg.name, pkg]));
  const packageNames = [...byName.keys()].sort();
  for (const component of cycles(packageNames, (name) =>
    (byName.get(name)?.dependencies ?? []).filter((dependency) =>
      byName.has(dependency),
    ),
  )) {
    const members = component
      .map((name) => `${rel(byName.get(name)!.dir)}/package.json`)
      .sort();
    violations.push({
      rule: 'R9',
      file: members[0]!,
      specifier: '',
      target: null,
      message: `package dependency cycle among ${component.join(', ')}`,
      members,
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
      message: `module cycle among ${component.join(', ')}`,
      members: component,
    });
  }
  return violations.sort((a, b) => a.file.localeCompare(b.file));
}
