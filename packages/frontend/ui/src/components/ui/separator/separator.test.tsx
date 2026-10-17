import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Separator } from '@synapcity/frontend-ui/core/separator';

describe('Separator', () => {
  it('is a horizontal separator by default', () => {
    render(<Separator />);
    const separator = screen.getByRole('separator');

    expect(separator.getAttribute('data-slot')).toBe('separator');
    expect(separator.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('can be vertical', () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole('separator');

    expect(separator.getAttribute('aria-orientation')).toBe('vertical');
    expect(separator.getAttribute('data-orientation')).toBe('vertical');
  });

  it('merges a caller className', () => {
    render(<Separator className="my-4" />);

    expect(screen.getByRole('separator').className).toContain('my-4');
  });
});
