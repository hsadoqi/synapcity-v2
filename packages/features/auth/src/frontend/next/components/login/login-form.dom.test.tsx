import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '../../../../contracts';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  resendConfirmation: vi.fn(),
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
    const { container } = render(
      <LoginForm
        signInWithPassword={mocks.signInWithPassword}
        resendConfirmation={mocks.resendConfirmation}
        next="/u/1/home"
      />,
    );

    expect(email().type).toBe('email');
    expect(email().autocomplete).toBe('email');
    expect(password().autocomplete).toBe('current-password');
    expect(
      (container.querySelector('input[name="next"]') as HTMLInputElement).value,
    ).toBe('/u/1/home');
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeTruthy();
  });

  it('leaves validation to the server so its message is the one shown', () => {
    render(
      <LoginForm
        signInWithPassword={mocks.signInWithPassword}
        resendConfirmation={mocks.resendConfirmation}
        next=""
      />,
    );

    expect(email().form!.noValidate).toBe(true);
  });

  it('marks both fields invalid for a wrong sign-in, without saying which was wrong', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: 'Email or password is incorrect.',
      fields: ['email', 'password'],
      data: { user: { email: 'ada@example.com' } },
    } satisfies AuthState);
    render(
      <LoginForm
        signInWithPassword={mocks.signInWithPassword}
        resendConfirmation={mocks.resendConfirmation}
        next=""
      />,
    );

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
    render(
      <LoginForm
        signInWithPassword={mocks.signInWithPassword}
        resendConfirmation={mocks.resendConfirmation}
        next=""
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Resend confirmation email' }),
    ).toBeNull();

    await submit();

    expect(
      screen.getByRole('button', { name: 'Resend confirmation email' }),
    ).toBeTruthy();
  });

  it('keeps the button reachable but inert while signing in', async () => {
    mocks.signInWithPassword.mockReturnValue(new Promise(() => {}));
    render(
      <LoginForm
        signInWithPassword={mocks.signInWithPassword}
        resendConfirmation={mocks.resendConfirmation}
        next=""
      />,
    );

    await submit();

    const button = screen.getByRole('button', { name: 'Signing in…' });
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(fireEvent.keyDown(button, { key: 'Enter' })).toBe(false);
    expect(fireEvent.keyDown(button, { key: ' ' })).toBe(false);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(mocks.signInWithPassword).toHaveBeenCalledTimes(1);
  });
});
