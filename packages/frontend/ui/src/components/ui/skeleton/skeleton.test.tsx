import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

describe('Skeleton', () => {
  it('renders a pulsing placeholder with its slot', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton.getAttribute('data-slot')).toBe('skeleton');
    expect(skeleton.className).toContain('animate-pulse');
  });

  it('merges a caller className', () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-48" />);

    expect(screen.getByTestId('skeleton').className).toContain('w-48');
  });
});
