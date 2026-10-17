import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IconButton } from '@synapcity/frontend-ui/components/icon-button';

describe('IconButton', () => {
  it('is named by its label', () => {
    render(<IconButton label="Home" />);
    const button = screen.getByRole('button', { name: 'Home' });

    expect(button.getAttribute('data-slot')).toBe('icon-button');
  });

  it('maps each size to a distinct icon size', () => {
    const classes = (['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => {
      const { unmount } = render(<IconButton label="x" size={size} />);
      const className = screen.getByRole('button').className;
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(5);
  });

  it('defaults to the medium icon size', () => {
    const { rerender } = render(<IconButton label="x" />);
    const fallback = screen.getByRole('button').className;
    rerender(<IconButton label="x" size="md" />);

    expect(screen.getByRole('button').className).toBe(fallback);
  });

  it('defaults to the default variant and honours another', () => {
    const { rerender } = render(<IconButton label="x" />);
    const fallback = screen.getByRole('button').className;
    rerender(<IconButton label="x" variant="outline" />);

    expect(screen.getByRole('button').className).not.toBe(fallback);
  });

  it('calls onClick and respects disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<IconButton label="x" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<IconButton label="x" disabled onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders its icon child', () => {
    render(
      <IconButton label="x">
        <svg data-testid="icon" aria-hidden />
      </IconButton>,
    );

    expect(screen.getByTestId('icon')).toBeTruthy();
  });
});
