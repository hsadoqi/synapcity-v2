import { describe, expect, it } from 'vitest';

import { formatAgo } from '@/features/collection/shared/query';

import { FIXTURE_NOW } from './fixture-clock';
import { fixtureItems, fixturePinned } from './overview.fixtures';

// The labels the overview showed when they were hand-written strings. Computed
// labels must read the same, so moving to the shared displays changed no text.
const PREVIOUS_LABELS: Record<string, string> = {
  'doc-q4-narrative': '2h ago',
  'dash-fundraise': '5h ago',
  'doc-interviews': 'Yesterday',
  'dash-weekly-metrics': 'Yesterday',
  'doc-pricing-rewrite': '2d ago',
  'doc-hiring-plan': '3d ago',
  'dash-runway': '4d ago',
  'doc-advisor-call': 'Last week',
};

describe('overview fixtures', () => {
  it.each(['UTC', 'America/New_York'])(
    'reproduce the hand-written "edited" labels in %s',
    (timeZone) => {
      const labels = Object.fromEntries(
        fixtureItems.map((item) => [
          item.id,
          formatAgo(item.updatedAt, FIXTURE_NOW, timeZone),
        ]),
      );
      expect(labels).toEqual(PREVIOUS_LABELS);
    },
  );

  it('mark the pinned items, in pinned order', () => {
    expect(fixturePinned.map((item) => item.id)).toEqual([
      'dash-weekly-metrics',
      'dash-runway',
      'doc-hiring-plan',
      'dash-fundraise',
    ]);
    expect(fixturePinned.every((item) => item.pinned)).toBe(true);
    expect(fixtureItems.filter((item) => item.pinned)).toHaveLength(4);
  });
});
