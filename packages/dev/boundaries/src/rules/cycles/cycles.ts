import type { Edge, Violation, Workspace } from '../../model/index.ts';
import { repoPath } from '../../paths/index.ts';

/**
 * Strongly connected components with more than one node, or a node with an edge to itself (Tarjan).
 * Iterative, so a long import chain cannot overflow the call stack.
 */
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

  for (const root of nodes) {
    if (index.has(root)) continue;
    const work: Array<{ node: string; child: number }> = [
      { node: root, child: 0 },
    ];
    index.set(root, counter);
    low.set(root, counter++);
    stack.push(root);
    onStack.add(root);

    while (work.length > 0) {
      const frame = work[work.length - 1]!;
      const children = next(frame.node);
      if (frame.child < children.length) {
        const neighbour = children[frame.child++]!;
        if (!index.has(neighbour)) {
          index.set(neighbour, counter);
          low.set(neighbour, counter++);
          stack.push(neighbour);
          onStack.add(neighbour);
          work.push({ node: neighbour, child: 0 });
        } else if (onStack.has(neighbour)) {
          low.set(
            frame.node,
            Math.min(low.get(frame.node)!, index.get(neighbour)!),
          );
        }
        continue;
      }
      work.pop();
      const parent = work[work.length - 1];
      if (parent) {
        low.set(
          parent.node,
          Math.min(low.get(parent.node)!, low.get(frame.node)!),
        );
      }
      if (low.get(frame.node) === index.get(frame.node)) {
        const component: string[] = [];
        let member: string;
        do {
          member = stack.pop()!;
          onStack.delete(member);
          component.push(member);
        } while (member !== frame.node);
        if (component.length > 1 || children.includes(frame.node))
          found.push(component.sort());
      }
    }
  }
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
