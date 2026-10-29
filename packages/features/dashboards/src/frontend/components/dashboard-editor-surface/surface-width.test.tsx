import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithStore } from '../../../testing';

// The surface's own content width, as `useElementWidth` reports it (the
// surface has no padding, so it equals its border box). Never the window's.
const width = vi.hoisted(() => ({ value: 579.6 }));
vi.mock('../../hooks/use-element-width', () => ({
  useElementWidth: () => [{ current: null }, width.value],
}));

const { DashboardEditorSurface } = await import('./index');

const pressed = (name: string) =>
  screen.getByRole('button', { name }).getAttribute('aria-pressed');

/*
 * D2-1 (approved 2026-10-29): the breakpoint follows the surface's width,
 * with the 640 and 1024 thresholds. Measured in S2 Task 1: at a 1280 px window
 * with the Widgets panel open the surface is 579.6 px, and at 1440 it is 704.5.
 */
describe('DashboardEditorSurface width', () => {
  it('lays out a 579.6 px surface (1280 window, Widgets open) in the single-column mobile layout, unframed', () => {
    width.value = 579.6;
    const { store } = renderWithStore(
      <TooltipProvider>
        <DashboardEditorSurface />
      </TooltipProvider>,
      { breakpoint: 'lg', breakpointLocked: false },
    );
    expect(store().getState().breakpoint).toBe('sm');
    expect(store().getState().breakpointLocked).toBe(false);
    expect(pressed('Mobile layout')).toBe('true');
    expect(screen.queryByText(/· (834|390)px/)).toBeNull();
  });

  it('lays out a 704.5 px surface (1440 window, Widgets open) in the tablet layout', () => {
    width.value = 704.5;
    const { store } = renderWithStore(
      <TooltipProvider>
        <DashboardEditorSurface />
      </TooltipProvider>,
      { breakpoint: 'lg', breakpointLocked: false },
    );
    expect(store().getState().breakpoint).toBe('md');
    expect(pressed('Tablet layout')).toBe('true');
  });
});
