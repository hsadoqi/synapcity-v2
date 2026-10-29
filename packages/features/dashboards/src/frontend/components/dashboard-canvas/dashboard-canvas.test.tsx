import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithStore } from '../../../testing';

const width = vi.hoisted(() => ({ value: 1400 as number | null }));
vi.mock('../../hooks/use-element-width', () => ({
  useElementWidth: () => [{ current: null }, width.value],
}));
vi.mock('../dashboard-grid', () => ({
  DashboardGrid: () => <input aria-label="Grid draft" defaultValue="draft" />,
}));

const { DashboardCanvas } = await import('./index');

// In these tests the width is the canvas element's own content width (what
// `useElementWidth` reports), never the window's.
function atCanvasWidth(value: number) {
  width.value = value;
}

describe('DashboardCanvas', () => {
  afterEach(() => {
    width.value = 1400;
  });

  it('frames the tablet layout at its device width when there is room', () => {
    renderWithStore(<DashboardCanvas />, {
      breakpoint: 'md',
      breakpointLocked: true,
    });
    expect(screen.getByText('Tablet · 834px')).toBeDefined();
  });

  it('does not frame an unlocked tablet canvas that is wider than the frame', () => {
    atCanvasWidth(960);
    renderWithStore(<DashboardCanvas />, {
      breakpoint: 'md',
      breakpointLocked: false,
    });
    expect(screen.queryByText('Tablet · 834px')).toBeNull();
  });

  it('does not frame an unlocked mobile canvas that is wider than the frame', () => {
    atCanvasWidth(500);
    renderWithStore(<DashboardCanvas />, {
      breakpoint: 'sm',
      breakpointLocked: false,
    });
    expect(screen.queryByText('Mobile · 390px')).toBeNull();
  });

  it('frames a locked tablet preview when there is room', () => {
    atCanvasWidth(1100);
    renderWithStore(<DashboardCanvas />, {
      breakpoint: 'md',
      breakpointLocked: true,
    });
    expect(screen.getByText('Tablet · 834px')).toBeDefined();
  });

  it('frames a locked mobile preview when there is room', () => {
    atCanvasWidth(500);
    renderWithStore(<DashboardCanvas />, {
      breakpoint: 'sm',
      breakpointLocked: true,
    });
    expect(screen.getByText('Mobile · 390px')).toBeDefined();
  });

  it('does not frame a locked preview without room', () => {
    atCanvasWidth(900);
    renderWithStore(<DashboardCanvas />, {
      breakpoint: 'md',
      breakpointLocked: true,
    });
    expect(screen.queryByText('Tablet · 834px')).toBeNull();
  });

  it('never frames when deviceFrame is false', () => {
    atCanvasWidth(1100);
    renderWithStore(<DashboardCanvas deviceFrame={false} />, {
      breakpoint: 'md',
      breakpointLocked: true,
    });
    expect(screen.queryByText('Tablet · 834px')).toBeNull();
  });

  it('lets the desktop layout fill the canvas', () => {
    renderWithStore(<DashboardCanvas />, { breakpoint: 'lg' });
    expect(screen.queryByText(/834px|390px/)).toBeNull();
  });

  it('drops the frame on a screen already that narrow', () => {
    width.value = 400;
    renderWithStore(<DashboardCanvas />, {
      breakpoint: 'sm',
      breakpointLocked: true,
    });
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
    renderWithStore(<Harness />, { breakpoint: 'md', breakpointLocked: true });
    const draft = screen.getByRole('textbox', { name: 'Grid draft' });
    draft.focus();
    width.value = 800;
    fireEvent.click(screen.getByRole('button', { name: 'Resize' }));

    expect(screen.getByRole('textbox', { name: 'Grid draft' })).toBe(draft);
    expect(document.activeElement).toBe(draft);
    width.value = 1400;
  });
});
