import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithStore } from '../../../testing';

const width = vi.hoisted(() => ({ value: 1400 as number | null }));
vi.mock('../../hooks/use-element-width', () => ({
  useElementWidth: () => [{ current: null }, width.value],
}));
vi.mock('../dashboard-grid', () => ({
  DashboardGrid: () => <input aria-label="Grid draft" defaultValue="draft" />,
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

  it('keeps the grid mounted when the available width toggles its frame', () => {
    function Harness() {
      const [, rerender] = useState(0);
      return (
        <>
          <button onClick={() => rerender((value) => value + 1)}>Resize</button>
          <DashboardCanvas />
        </>
      );
    }

    width.value = 1400;
    renderWithStore(<Harness />, { breakpoint: 'md' });
    const draft = screen.getByRole('textbox', { name: 'Grid draft' });
    draft.focus();
    width.value = 800;
    fireEvent.click(screen.getByRole('button', { name: 'Resize' }));

    expect(screen.getByRole('textbox', { name: 'Grid draft' })).toBe(draft);
    expect(document.activeElement).toBe(draft);
    width.value = 1400;
  });
});
