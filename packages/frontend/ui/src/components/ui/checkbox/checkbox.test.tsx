import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from '@synapcity/frontend-ui/core/checkbox';

describe('Checkbox', () => {
  it('is a checkbox that starts unchecked', () => {
    render(<Checkbox aria-label="Done" />);
    const box = screen.getByRole('checkbox', { name: 'Done' });
    expect(box.getAttribute('aria-checked')).toBe('false');
    expect(box.getAttribute('data-slot')).toBe('checkbox');
  });

  it('reports the new state when clicked', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Done" onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.any(Object));
  });

  it('does not change when disabled', () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox aria-label="Done" disabled onCheckedChange={onCheckedChange} />,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
