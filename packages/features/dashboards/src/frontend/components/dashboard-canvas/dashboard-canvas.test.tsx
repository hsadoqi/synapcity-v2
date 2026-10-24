import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithStore } from '../../../testing/render-with-store';

const width = vi.hoisted(() => ({ value: 1400 as number | null }));
vi.mock('../../hooks/use-element-width', () => ({
  useElementWidth: () => [{ current: null }, width.value],
}));

const { DashboardCanvas } = await import('./index');

describe('DashboardCanvas', () => {
  it('frames the tablet layout at its device width when there is room', () => {
    renderWithStore(<DashboardCanvas />, { breakpoint: 'md' });
    expect(screen.getByText('Tablet · 834px')).toBeDefined();
  });

  it('lets the desktop layout fill the canvas', () => {
    renderWithStore(<DashboardCanvas />, { breakpoint: 'lg' });
    expect(screen.queryByText(/834px|390px/)).toBeNull();
  });

  it('drops the frame on a screen already that narrow', () => {
    width.value = 400;
    renderWithStore(<DashboardCanvas />, { breakpoint: 'sm' });
    expect(screen.queryByText('Mobile · 390px')).toBeNull();
    width.value = 1400;
  });
});
