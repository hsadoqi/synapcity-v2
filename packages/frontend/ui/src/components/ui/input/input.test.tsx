import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Input } from '@synapcity/frontend-ui/core/input';

describe('Input', () => {
  it('renders a textbox marked with its slot', () => {
    render(<Input aria-label="Email" />);
    const input = screen.getByRole('textbox', { name: 'Email' });

    expect(input.getAttribute('data-slot')).toBe('input');
  });

  it('passes type through', () => {
    render(<Input aria-label="Email" type="email" />);

    expect(screen.getByLabelText('Email').getAttribute('type')).toBe('email');
  });

  it('reports changes', () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Hanaa' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'Hanaa',
    );
  });

  it('is disabled when asked', () => {
    render(<Input aria-label="Name" disabled />);

    expect((screen.getByLabelText('Name') as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it('exposes invalid state', () => {
    render(<Input aria-label="Name" aria-invalid />);

    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('merges a caller className', () => {
    render(<Input aria-label="Name" className="max-w-xs" />);

    expect(screen.getByLabelText('Name').className).toContain('max-w-xs');
  });
});
