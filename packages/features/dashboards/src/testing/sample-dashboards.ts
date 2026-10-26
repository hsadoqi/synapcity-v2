import type { DashboardSummary } from '@synapcity/domain-dashboards';
import { createDashboardEntity } from '@synapcity/dev-fixtures';

/**
 * Test and story sample data, not part of the package's public interface.
 * Eight dashboards, enough for the index to show its carousel and pinned
 * panel; the first two are pinned, the third is not.
 */
export const sampleSummaries: DashboardSummary[] = [
  {
    ...createDashboardEntity({
      id: 'fixture-dashboard-project-status',
      name: 'Project status',
      description: 'Where each project stands this week.',
      icon: 'layout-dashboard',
      tags: ['work'],
      createdAt: '2026-10-14T09:00:00Z',
      updatedAt: '2026-10-17T15:00:00Z',
      pinnedAt: '2026-10-13T09:00:00Z',
      lastViewedAt: '2026-10-17T15:30:00Z',
    }),
    spacesTotal: 2,
  },
  {
    ...createDashboardEntity({
      id: 'fixture-dashboard-reading-progress',
      name: 'Reading progress',
      description: 'Pages read against the yearly goal.',
      icon: 'chart-line',
      tags: ['learning'],
      createdAt: '2026-10-11T20:00:00Z',
      updatedAt: '2026-10-16T21:10:00Z',
      pinnedAt: '2026-10-12T09:00:00Z',
      lastViewedAt: null,
    }),
    spacesTotal: 1,
  },
  {
    ...createDashboardEntity({
      id: 'fixture-dashboard-word-count',
      name: 'Word count tracker',
      description: 'Daily words, with the streak.',
      icon: 'chart-pie',
      tags: ['writing'],
      createdAt: '2026-10-08T08:00:00Z',
      updatedAt: '2026-10-15T18:00:00Z',
      pinnedAt: null,
      lastViewedAt: '2026-10-12T08:00:00Z',
    }),
    spacesTotal: 1,
  },
  {
    ...createDashboardEntity({
      id: 'fixture-dashboard-training-log',
      name: 'Training log',
      description: 'Sessions, load, and how it felt.',
      icon: 'target',
      tags: ['personal', 'tracking'],
      createdAt: '2026-10-02T07:00:00Z',
      updatedAt: '2026-10-02T07:00:00Z',
      pinnedAt: null,
      lastViewedAt: null,
    }),
    spacesTotal: 1,
  },
  {
    ...createDashboardEntity({
      id: 'fixture-dashboard-weekly-plan',
      name: 'Weekly plan',
      description: undefined,
      icon: 'calendar',
      tags: ['planning'],
      createdAt: '2026-09-27T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
      pinnedAt: null,
      lastViewedAt: null,
    }),
    spacesTotal: 0,
  },
  {
    ...createDashboardEntity({
      id: 'fixture-dashboard-sleep',
      name: 'Sleep',
      description: 'Hours and consistency over the last month.',
      icon: 'clock',
      tags: ['personal', 'tracking'],
      createdAt: '2026-09-18T22:00:00Z',
      updatedAt: '2026-09-28T07:30:00Z',
      pinnedAt: null,
      lastViewedAt: null,
    }),
    spacesTotal: 1,
  },
  {
    ...createDashboardEntity({
      id: 'fixture-dashboard-budget',
      name: 'Budget',
      description: undefined,
      icon: 'chart-pie',
      tags: ['personal'],
      createdAt: '2026-09-10T12:00:00Z',
      updatedAt: '2026-09-10T12:00:00Z',
      pinnedAt: null,
      lastViewedAt: null,
    }),
    spacesTotal: 0,
  },
  {
    ...createDashboardEntity({
      id: 'fixture-dashboard-trip-checklist',
      name: 'Trip checklist',
      description: 'Everything to do before leaving.',
      icon: 'list-checks',
      tags: ['planning'],
      createdAt: '2026-09-05T12:00:00Z',
      updatedAt: '2026-09-12T12:00:00Z',
      pinnedAt: null,
      lastViewedAt: null,
    }),
    spacesTotal: 1,
  },
];
