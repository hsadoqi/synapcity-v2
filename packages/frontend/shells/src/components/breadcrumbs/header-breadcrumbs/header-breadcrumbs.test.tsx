import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HeaderBreadcrumbs } from '.';

const trail = [
  { label: 'Spaces', href: '/u/home/spaces' },
  { label: 'Fitness', href: '/u/home/spaces/fitness' },
  { label: 'Plan' },
];

describe('HeaderBreadcrumbs', () => {
  it('links each parent and ends on the current page without a link', () => {
    render(<HeaderBreadcrumbs items={trail} />);

    expect(
      screen.getByRole('link', { name: 'Spaces' }).getAttribute('href'),
    ).toBe('/u/home/spaces');
    expect(screen.getByText('Plan').getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Plan').closest('a')).toBeNull();
  });

  it('shows a parent without a href as plain text', () => {
    render(<HeaderBreadcrumbs items={[{ label: 'Home' }, { label: 'Now' }]} />);

    expect(screen.getByText('Home').closest('a')).toBeNull();
  });

  it('hides every parent below sm so only the current page shows', () => {
    render(<HeaderBreadcrumbs items={trail} />);

    expect(screen.getByText('Spaces').closest('li')?.className).toContain(
      'hidden sm:inline-flex',
    );
    expect(screen.getByText('Plan').closest('li')?.className).not.toContain(
      'hidden',
    );
  });

  it('renders a spacer, not a landmark, when there is no trail', () => {
    const { container } = render(<HeaderBreadcrumbs items={[]} />);

    expect(screen.queryByRole('navigation')).toBeNull();
    expect(container.firstElementChild?.className).toContain('flex-1');
  });
});
