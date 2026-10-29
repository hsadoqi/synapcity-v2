import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Toggle, toggleVariants } from '@synapcity/frontend-ui/core/toggle';

describe('Toggle', () => {
  it('is an unpressed button by default', () => {
    render(<Toggle aria-label="Bold" />);
    const toggle = screen.getByRole('button', { name: 'Bold' });

    expect(toggle.getAttribute('data-slot')).toBe('toggle');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('flips pressed state on click and reports it', () => {
    const onPressedChange = vi.fn();
    render(<Toggle aria-label="Bold" onPressedChange={onPressedChange} />);
    const toggle = screen.getByRole('button', { name: 'Bold' });

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(onPressedChange).toHaveBeenLastCalledWith(true, expect.any(Object));
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('starts pressed with defaultPressed', () => {
    render(<Toggle aria-label="Bold" defaultPressed />);

    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('does not toggle when disabled', () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle aria-label="Bold" disabled onPressedChange={onPressedChange} />,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it('gives each variant and size its own classes', () => {
    const variants = ['default', 'outline', 'ghost', 'destructive'] as const;
    const sizes = [
      'default',
      'sm',
      'lg',
      'icon-xs',
      'icon-sm',
      'icon',
      'icon-lg',
      'icon-xl',
    ] as const;

    const base = toggleVariants({ variant: 'default' });

    expect(toggleVariants({ variant: 'outline' })).not.toBe(base);
    expect(toggleVariants({ variant: 'destructive' })).not.toBe(base);
    expect(variants).toContain('ghost');
    expect(new Set(sizes.map((size) => toggleVariants({ size }))).size).toBe(
      sizes.length,
    );
  });
});
