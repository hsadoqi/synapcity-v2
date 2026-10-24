import { createComposition } from '@synapcity/domain-dashboards';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../../../testing/render-with-store';
import { DashboardGrid, handleLayoutChange } from './index';

describe('DashboardGrid', () => {
  it('renders a widget for each active widget', () => {
    const { container, store } = renderWithStore(<DashboardGrid />);
    expect(container.querySelectorAll('[data-slot="widget"]')).toHaveLength(
      store().getState().composition.widgets.length,
    );
  });

  it('shows the empty state when no widget is active', () => {
    renderWithStore(<DashboardGrid />, {
      composition: createComposition(),
      records: emptyRecords(),
    });
    expect(screen.getByText('No widgets yet')).toBeDefined();
  });
});

describe('handleLayoutChange', () => {
  it('ignores the layout the grid was given', () => {
    const { store } = renderWithStore(<p />, { breakpoint: 'md' });
    const before = store().getState().composition;
    const given = before.layouts.md;
    handleLayoutChange(store().getState(), given, given);
    expect(store().getState().composition).toBe(before);
  });

  it('stores a changed layout for the shown breakpoint only', () => {
    const { store } = renderWithStore(<p />, { breakpoint: 'md' });
    const before = store().getState().composition.layouts;
    const [first, ...rest] = before.md;
    const reported = [{ ...first!, y: first!.y + 10 }, ...rest];
    handleLayoutChange(store().getState(), before.md, reported);
    const after = store().getState().composition.layouts;
    expect(after.md[0]?.y).toBe(first!.y + 10);
    expect(after.lg).toBe(before.lg);
    expect(after.sm).toBe(before.sm);
  });
});
