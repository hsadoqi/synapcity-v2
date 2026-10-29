import {
  LINK_WIDGET_TYPES,
  dashboardCompositionSchema,
} from '@synapcity/domain-dashboards';
import { describe, expect, it } from 'vitest';

import { DASHBOARD_FIXTURES } from './dashboards';
import { fixtureComposition } from './fixture-compositions';

describe('fixtureComposition', () => {
  const seeded = DASHBOARD_FIXTURES.flatMap((dashboard) => {
    const composition = fixtureComposition(dashboard.id);
    return composition ? [{ id: dashboard.id, composition }] : [];
  });

  it('seeds at least one fixture dashboard', () => {
    expect(seeded.length).toBeGreaterThan(0);
  });

  it('every seeded composition parses with dashboardCompositionSchema', () => {
    for (const { composition } of seeded) {
      expect(dashboardCompositionSchema.safeParse(composition).success).toBe(
        true,
      );
    }
  });

  it('reading-progress has no seed', () => {
    // Its empty state and Add a widget are what dashboard-edit.e2e.ts tests.
    expect(fixtureComposition('fixture-dashboard-reading-progress')).toBeNull();
  });

  it('has no seed for a dashboard that is not a fixture', () => {
    expect(fixtureComposition('11111111-1111-4111-8111-111111111111')).toBe(
      null,
    );
  });

  it('the project-status seed has at least one widget of each link widget type', () => {
    const types = fixtureComposition(
      'fixture-dashboard-project-status',
    )?.widgets.map((widget) => widget.type);
    for (const type of LINK_WIDGET_TYPES) expect(types).toContain(type);
  });

  it('seeds only the widget types the page offers', () => {
    for (const { composition } of seeded) {
      for (const widget of composition.widgets) {
        expect(LINK_WIDGET_TYPES).toContain(widget.type);
      }
    }
  });

  it('places every seeded widget at every breakpoint', () => {
    for (const { composition } of seeded) {
      const ids = composition.widgets.map((widget) => widget.id).sort();
      for (const bp of ['lg', 'md', 'sm'] as const) {
        expect(composition.layouts[bp].map((item) => item.i).sort()).toEqual(
          ids,
        );
      }
    }
  });

  it('returns a fresh copy each time, so an edit cannot change the seed', () => {
    const first = fixtureComposition('fixture-dashboard-project-status');
    const second = fixtureComposition('fixture-dashboard-project-status');
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first?.widgets).not.toBe(second?.widgets);
  });
});
