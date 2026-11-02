import { render, screen } from '@testing-library/react';
import { Pin } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { SectionHeading } from '@synapcity/frontend-blocks';

describe('SectionHeading', () => {
  it('is a level-two heading that a section can point at by id', () => {
    render(<SectionHeading id="recent-heading">Recent</SectionHeading>);
    const heading = screen.getByRole('heading', { level: 2, name: 'Recent' });

    expect(heading.id).toBe('recent-heading');
  });

  it('shows its icon without adding it to the accessible name', () => {
    const { container } = render(
      <SectionHeading icon={Pin}>Pinned</SectionHeading>,
    );

    expect(screen.getByRole('heading', { name: 'Pinned' })).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
