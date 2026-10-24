import type { WidgetType } from '@synapcity/domain-dashboards';
import { describe, expect, it } from 'vitest';

import { WIDGET_CATALOG } from './index';

const ALL_TYPES: WidgetType[] = [
  'stat',
  'progress',
  'habit',
  'notes',
  'tasks',
  'calendar',
  'feed',
];

describe('WIDGET_CATALOG', () => {
  it("lists the palette labels in the prototype's order", () => {
    expect(WIDGET_CATALOG.map((entry) => entry.label)).toEqual([
      'Stat card',
      'Task list',
      'Recent activity',
      'Schedule',
      'Notes',
      'Habit tracker',
      'Goal tracker',
    ]);
  });

  it('covers every widget type exactly once', () => {
    expect([...WIDGET_CATALOG.map((entry) => entry.type)].sort()).toEqual(
      [...ALL_TYPES].sort(),
    );
  });
});
