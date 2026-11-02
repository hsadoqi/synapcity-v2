import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PasswordInput } from '@synapcity/frontend-blocks';

describe('PasswordInput', () => {
  it('hides the password until asked', () => {
    render(<PasswordInput aria-label="Password" />);

    expect(screen.getByLabelText('Password').getAttribute('type')).toBe(
      'password',
    );
  });

  it('reveals and re-hides the password with a pressed toggle', () => {
    render(<PasswordInput aria-label="Password" />);
    const toggle = screen.getByRole('button', { name: 'Show password' });

    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(toggle);
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe(
      'password',
    );
  });

  it('keeps the toggle out of form submission', () => {
    render(<PasswordInput aria-label="Password" />);

    expect(
      screen
        .getByRole('button', { name: 'Show password' })
        .getAttribute('type'),
    ).toBe('button');
  });

  it('passes field attributes through to the input', () => {
    render(
      <PasswordInput
        aria-label="Password"
        name="password"
        autoComplete="new-password"
        aria-invalid
      />,
    );
    const input = screen.getByLabelText('Password');

    expect(input.getAttribute('name')).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('new-password');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
