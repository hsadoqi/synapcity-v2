import { GRAPHS, type Graph } from '../model/index.ts';

const EVERY_GRAPH: readonly Graph[] = GRAPHS;

/**
 * ADR-0014 section 2, the dependency and runtime matrix: what each graph may import.
 * "Conditional" cells are allowed here; their conditions are separate rules (R3–R8).
 * Same-app browser/backend edges are allowed here; R3 judges what reaches the browser.
 * Testing and dev code is non-production and may import anything; R8 keeps it out of production.
 */
export const MATRIX: Record<Graph, readonly Graph[]> = {
  domain: ['domain'],
  frontend: ['domain', 'frontend'],
  server: ['domain', 'server'],
  'feature-contracts': ['domain', 'feature-contracts'],
  'feature-frontend': [
    'domain',
    'frontend',
    'feature-contracts',
    'feature-frontend',
  ],
  'feature-server': ['domain', 'server', 'feature-contracts', 'feature-server'],
  'app-browser': [
    'domain',
    'frontend',
    'feature-contracts',
    'feature-frontend',
    'app-browser',
    'app-backend',
  ],
  'app-backend': [
    'domain',
    'frontend',
    'server',
    'feature-contracts',
    'feature-frontend',
    'feature-server',
    'app-browser',
    'app-backend',
  ],
  testing: EVERY_GRAPH,
  dev: EVERY_GRAPH,
};

export function isAllowed(from: Graph, to: Graph): boolean {
  return MATRIX[from].includes(to);
}
