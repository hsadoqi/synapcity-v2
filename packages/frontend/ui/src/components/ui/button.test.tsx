import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('is named by its visible text unless given a label', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });

    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('uses the label as its accessible name', () => {
    render(<Button label="Save note">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save note' })).toBeTruthy();
  });

  it('applies the default variant and size', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button').getAttribute('data-slot')).toBe('button');
  });

  it('opts into a toggle without nesting buttons', () => {
    const onPressedChange = vi.fn();
    render(
      <Button toggle label="Pin" onPressedChange={onPressedChange}>
        Pin
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Pin' });

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(button.textContent).toBe('Pin');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(onPressedChange).toHaveBeenCalledWith(true, expect.any(Object));
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps ordinary buttons free of toggle state', () => {
    render(<Button label="Save" />);
    expect(screen.getByRole('button').hasAttribute('aria-pressed')).toBe(false);
  });

  it('does not toggle when disabled', () => {
    const onPressedChange = vi.fn();
    render(
      <Button toggle disabled label="Pin" onPressedChange={onPressedChange} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});
