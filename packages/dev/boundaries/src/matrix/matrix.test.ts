import { describe, expect, it } from 'vitest';

import type { Graph } from '../model/index.ts';
import { isAllowed } from './index.ts';

// One case per ADR-0014 section 2 row (allowed and forbidden columns).
const cases: Array<[Graph, Graph, boolean]> = [
  ['domain', 'domain', true],
  ['domain', 'frontend', false],
  ['domain', 'server', false],
  ['frontend', 'domain', true],
  ['frontend', 'frontend', true],
  ['frontend', 'server', false],
  ['frontend', 'feature-contracts', false],
  ['server', 'domain', true],
  ['server', 'server', true],
  ['server', 'frontend', false],
  ['server', 'feature-server', false],
  ['feature-contracts', 'domain', true],
  ['feature-contracts', 'feature-contracts', true],
  ['feature-contracts', 'frontend', false],
  ['feature-frontend', 'domain', true],
  ['feature-frontend', 'frontend', true],
  ['feature-frontend', 'feature-contracts', true],
  ['feature-frontend', 'feature-frontend', true],
  ['feature-frontend', 'server', false],
  ['feature-frontend', 'feature-server', false],
  ['feature-server', 'domain', true],
  ['feature-server', 'server', true],
  ['feature-server', 'feature-contracts', true],
  ['feature-server', 'feature-server', true],
  ['feature-server', 'feature-frontend', false],
  ['feature-server', 'frontend', false],
  ['app-browser', 'frontend', true],
  ['app-browser', 'feature-frontend', true],
  ['app-browser', 'server', false],
  ['app-browser', 'feature-server', false],
  ['app-backend', 'server', true],
  ['app-backend', 'feature-server', true],
  ['app-backend', 'frontend', true],
];

describe('isAllowed', () => {
  it.each(cases)('%s → %s is %s', (from, to, allowed) => {
    expect(isAllowed(from, to)).toBe(allowed);
  });

  it('lets no production graph import testing or dev code', () => {
    const production: Graph[] = [
      'domain',
      'frontend',
      'server',
      'feature-contracts',
      'feature-frontend',
      'feature-server',
      'app-browser',
      'app-backend',
    ];
    for (const from of production) {
      expect(isAllowed(from, 'testing')).toBe(false);
      expect(isAllowed(from, 'dev')).toBe(false);
    }
  });
});
