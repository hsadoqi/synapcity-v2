import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardEmptyState } from './index';

describe('DashboardEmptyState', () => {
  it('points at the widgets palette', () => {
    render(<DashboardEmptyState />);
    expect(screen.getByText('No widgets yet')).toBeDefined();
    expect(
      screen.getByText(/Turn on Edit layout and add one from the panel\./),
    ).toBeDefined();
  });

  it('read-only, says editing is not available instead', () => {
    render(<DashboardEmptyState readOnly />);
    expect(
      screen.getByText('Editing dashboards is not available yet.'),
    ).toBeDefined();
    expect(screen.queryByText(/Turn on Edit layout/)).toBeNull();
  });
});
