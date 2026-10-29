import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardEmptyState } from './index';

describe('DashboardEmptyState', () => {
  it('offers Add a widget, which the host answers', () => {
    const onAdd = vi.fn();
    render(<DashboardEmptyState onAdd={onAdd} />);
    expect(screen.getByText('No widgets yet')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Add a widget' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('has no button when the host gave no way to add', () => {
    render(<DashboardEmptyState />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('read-only, says editing is not available instead', () => {
    render(<DashboardEmptyState readOnly onAdd={() => {}} />);
    expect(
      screen.getByText('Editing dashboards is not available yet.'),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Add a widget' })).toBeNull();
  });
});
