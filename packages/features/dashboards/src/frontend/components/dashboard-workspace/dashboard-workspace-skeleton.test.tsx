import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardWorkspaceSkeleton } from './dashboard-workspace-skeleton';

describe('DashboardWorkspaceSkeleton', () => {
  it('announces once, with text, inside one busy region', () => {
    const { container } = render(<DashboardWorkspaceSkeleton />);
    const statuses = screen.getAllByRole('status');

    expect(statuses).toHaveLength(1);
    expect(statuses[0]?.textContent).toBe('Loading dashboard…');
    expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('.sr-only')).toHaveLength(1);
  });

  it('keeps the canvas layout on the busy region', () => {
    const { container } = render(<DashboardWorkspaceSkeleton />);
    const region = container.firstElementChild;
    const classes = region?.className.split(' ') ?? [];

    expect(region?.getAttribute('aria-busy')).toBe('true');
    expect(classes).toEqual(
      expect.arrayContaining([
        'flex',
        'flex-col',
        'min-h-96',
        'flex-1',
        'gap-4',
        'p-5',
      ]),
    );
    expect(classes).not.toContain('gap-10');
  });
});
