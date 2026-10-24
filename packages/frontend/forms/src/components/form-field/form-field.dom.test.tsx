import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from './form-field';

const field = () => screen.getByLabelText('Email') as HTMLInputElement;

describe('FormField', () => {
  it('labels an input and names it by its id', () => {
    render(<FormField id="email" label="Email" type="email" />);

    expect(field().id).toBe('email');
    expect(field().name).toBe('email');
    expect(field().type).toBe('email');
  });

  it('forwards other input props', () => {
    render(
      <FormField id="email" label="Email" autoComplete="email" required />,
    );

    expect(field().autocomplete).toBe('email');
    expect(field().required).toBe(true);
  });

  it('shows a hint and describes the field by it', () => {
    render(<FormField id="email" label="Email" hint="Work address." />);

    expect(screen.getByText('Work address.').id).toBe('email-hint');
    expect(field().getAttribute('aria-describedby')).toBe('email-hint');
  });

  it('is not invalid or described when nothing is wrong', () => {
    render(<FormField id="email" label="Email" />);

    expect(field().hasAttribute('aria-invalid')).toBe(false);
    expect(field().hasAttribute('aria-describedby')).toBe(false);
  });

  it('points an invalid field at its message and drops the hint', () => {
    render(
      <FormField
        id="email"
        label="Email"
        hint="Work address."
        invalid
        messageId="msg"
      />,
    );

    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(field().getAttribute('aria-describedby')).toBe('msg');
    expect(screen.queryByText('Work address.')).toBeNull();
  });

  it('puts a label action beside the label', () => {
    render(
      <FormField
        id="email"
        label="Email"
        labelAction={<button type="button">Help</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Help' })).toBeTruthy();
    expect(field()).toBeTruthy();
  });

  it('uses a password input, with its reveal control, for passwords', () => {
    render(<FormField id="password" label="Password" type="password" />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;

    expect(input.type).toBe('password');
    expect(input.name).toBe('password');
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
