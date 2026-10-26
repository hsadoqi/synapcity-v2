import { describe, expect, it } from 'vitest';

import { createDashboardEntity } from '@synapcity/dev-fixtures';
import type { DashboardSummary } from '@synapcity/domain-dashboards';

import {
  describeSpaces,
  dashboardPath,
  toCollectionItem,
} from './collection-item';

const record: DashboardSummary = {
  ...createDashboardEntity({
    id: 'dashboard-1',
    description: 'Steps.',
    icon: 'layout-dashboard',
    tags: ['work'],
  }),
  spacesTotal: 2,
};

describe('describeSpaces', () => {
  it.each([
    [0, 'Not in a space'],
    [1, 'In 1 space'],
    [3, 'In 3 spaces'],
  ])('describes %i spaces', (count, expected) => {
    expect(describeSpaces(count)).toBe(expected);
  });
});

describe('dashboardPath', () => {
  it('builds the page under the home address the host supplies', () => {
    expect(dashboardPath('/user-1/home', 'dashboard-1')).toBe(
      '/user-1/home/dashboards/dashboard-1',
    );
  });
});

describe('toCollectionItem', () => {
  it('maps a dashboard onto the browse feature’s item, linked under the owner', () => {
    expect(toCollectionItem(record, '/user-1/home')).toMatchObject({
      id: 'dashboard-1',
      title: 'Weekly review',
      subtitle: 'Steps.',
      icon: 'layout-dashboard',
      href: '/user-1/home/dashboards/dashboard-1',
      detail: 'In 2 spaces',
      pinned: false,
    });
  });

  it('is pinned when it has a pinned time', () => {
    expect(
      toCollectionItem({ ...record, pinnedAt: '2026-10-04T09:00:00Z' }, '/u')
        .pinned,
    ).toBe(true);
  });
});
