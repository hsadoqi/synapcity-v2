import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@synapcity/features-auth/contracts';
import { ForgotPasswordForm } from './forgot-password-form';

const show = (state: AuthState = {}, pending = false) =>
  render(
    <ForgotPasswordForm state={state} formAction={vi.fn()} pending={pending} />,
  );
const email = () => screen.getByLabelText('Email') as HTMLInputElement;

describe('ForgotPasswordForm', () => {
  it('asks for just an email, labelled, with the right autofill', () => {
    show();

    expect(email().type).toBe('email');
    expect(email().autocomplete).toBe('email');
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(email().form!.noValidate).toBe(true);
  });

  it('refills the address and marks it when the request is refused', () => {
    show({
      error: 'Enter your email.',
      fields: ['email'],
      data: { user: { email: 'ada@example.com' } },
    });

    expect(email().value).toBe('ada@example.com');
    expect(email().getAttribute('aria-invalid')).toBe('true');
    expect(email().getAttribute('aria-describedby')).toBe(
      screen.getByRole('alert').id,
    );
  });

  it('shows progress while sending', () => {
    show({}, true);

    const button = screen.getByRole('button', { name: 'Sending…' });
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});
