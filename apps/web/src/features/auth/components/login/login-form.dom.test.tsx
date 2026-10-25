import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@synapcity/features-auth/contracts';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  resendConfirmation: vi.fn(),
}));

vi.mock('@/features/auth/server/actions/actions', () => ({
  signInWithPassword: mocks.signInWithPassword,
  resendConfirmation: mocks.resendConfirmation,
}));

import { LoginForm } from './login-form';

const email = () => screen.getByLabelText('Email') as HTMLInputElement;
const password = () => screen.getByLabelText('Password') as HTMLInputElement;
const submit = () =>
  act(async () => {
    fireEvent.submit(email().form!);
  });

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('labels both fields, suggests the right autofill and carries the destination', () => {
    const { container } = render(<LoginForm next="/u/1/home" />);

    expect(email().type).toBe('email');
    expect(email().autocomplete).toBe('email');
    expect(password().autocomplete).toBe('current-password');
    expect(
      (container.querySelector('input[name="next"]') as HTMLInputElement).value,
    ).toBe('/u/1/home');
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeTruthy();
  });

  it('leaves validation to the server so its message is the one shown', () => {
    render(<LoginForm next="" />);

    expect(email().form!.noValidate).toBe(true);
  });

  it('marks both fields invalid for a wrong sign-in, without saying which was wrong', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: 'Email or password is incorrect.',
      fields: ['email', 'password'],
      data: { user: { email: 'ada@example.com' } },
    } satisfies AuthState);
    render(<LoginForm next="" />);

    await submit();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Email or password is incorrect.');
    for (const input of [email(), password()]) {
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    }
    // The address is refilled, so the emptied password is what needs retyping.
    expect(email().value).toBe('ada@example.com');
    expect(document.activeElement).toBe(password());
  });

  it('offers a new confirmation email only for an unconfirmed address', async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      error: 'Confirm your email first.',
      unconfirmed: true,
      data: { user: { email: 'ada@example.com' } },
    } satisfies AuthState);
    render(<LoginForm next="" />);
    expect(
      screen.queryByRole('button', { name: 'Resend confirmation email' }),
    ).toBeNull();

    await submit();

    expect(
      screen.getByRole('button', { name: 'Resend confirmation email' }),
    ).toBeTruthy();
  });

  it('disables the button while signing in', async () => {
    mocks.signInWithPassword.mockReturnValue(new Promise(() => {}));
    render(<LoginForm next="" />);

    await submit();

    const button = screen.getByRole('button', { name: 'Signing in…' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});
