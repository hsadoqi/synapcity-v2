import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithStore } from '../../../testing';
import { DashboardWidgetsDestination } from './index';

describe('DashboardWidgetsDestination', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('explains how to start editing while editing is off, without turning it on', () => {
    const { store } = renderWithStore(<DashboardWidgetsDestination />);
    expect(screen.getByText(/Choose Edit layout/)).toBeDefined();
    expect(
      screen.queryByRole('region', { name: 'Add to dashboard' }),
    ).toBeNull();
    expect(store().getState().editMode).toBe(false);
  });

  it('turns editing on through the store from its explicit button, and keeps focus in the palette', () => {
    const { store } = renderWithStore(<DashboardWidgetsDestination />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit layout' }));
    expect(store().getState().editMode).toBe(true);
    act(() => vi.advanceTimersByTime(50));
    const palette = screen.getByRole('region', { name: 'Add to dashboard' });
    expect(document.activeElement).toBe(
      within(palette).getAllByRole('button')[0],
    );
  });

  it('shows the palette and arrange list while editing, and adding goes through the store', () => {
    const { store } = renderWithStore(<DashboardWidgetsDestination />);
    act(() => store().getState().toggleEditMode());
    const palette = screen.getByRole('region', { name: 'Add to dashboard' });
    const before = store().getState().composition.widgets.length;
    fireEvent.click(within(palette).getByRole('button', { name: 'Notes' }));
    expect(store().getState().composition.widgets.length).toBe(before + 1);
    expect(screen.getByRole('region', { name: 'Arrange' })).toBeDefined();
  });

  it('holds no copy of the dashboard: a change made elsewhere shows at once', () => {
    const { store } = renderWithStore(<DashboardWidgetsDestination />);
    act(() => store().getState().toggleEditMode());
    const count = () => screen.getAllByRole('listitem').length;
    const before = count();
    act(() => store().getState().addWidget('stat'));
    expect(count()).toBe(before + 1);
  });

  it('switches back to the explanation when editing ends, without touching the composition', () => {
    const { store } = renderWithStore(<DashboardWidgetsDestination />);
    act(() => store().getState().toggleEditMode());
    const composition = store().getState().composition;
    act(() => store().getState().toggleEditMode());
    expect(screen.getByText(/Choose Edit layout/)).toBeDefined();
    expect(store().getState().composition).toBe(composition);
  });
});
