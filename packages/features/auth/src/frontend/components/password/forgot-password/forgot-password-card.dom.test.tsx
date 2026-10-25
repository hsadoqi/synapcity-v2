import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }));

import { ForgotPasswordCard } from './forgot-password-card';

/**
 * Types an address, then submits. The form validates in the browser first, so
 * a test that wants the server's reply has to send something the schema accepts.
 */
const submit = (email = 'ada@example.com') =>
  act(async () => {
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: email },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Send reset link' }).closest('form')!,
    );
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requestPasswordReset.mockResolvedValue({});
});

describe('ForgotPasswordCard', () => {
  it('asks for an email under one h1, with a way back to sign in', () => {
    render(
      <ForgotPasswordCard requestPasswordReset={mocks.requestPasswordReset} />,
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Reset your password',
    );
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Back to sign in' })
        .getAttribute('href'),
    ).toBe('/auth/login');
  });

  it('explains an expired link when it was sent here for that', () => {
    render(
      <ForgotPasswordCard
        requestPasswordReset={mocks.requestPasswordReset}
        expired
      />,
    );

    expect(screen.getByText(/has expired or was already used/)).toBeTruthy();
  });

  it('gives the usual instructions otherwise', () => {
    render(
      <ForgotPasswordCard requestPasswordReset={mocks.requestPasswordReset} />,
    );

    expect(screen.getByText(/we’ll send you a link/)).toBeTruthy();
    expect(screen.queryByText(/has expired/)).toBeNull();
  });

  it('confirms the request and offers a resend', async () => {
    mocks.requestPasswordReset.mockResolvedValue({
      success: true,
      message: 'If that account exists, we sent a link.',
      data: { user: { email: 'ada@example.com' } },
    });
    render(
      <ForgotPasswordCard requestPasswordReset={mocks.requestPasswordReset} />,
    );

    await submit();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Check your email',
    );
    expect(
      screen.getByText('If that account exists, we sent a link.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Resend link' })).toBeTruthy();
  });

  it('returns to the form to change the address', async () => {
    mocks.requestPasswordReset.mockResolvedValue({
      success: true,
      message: 'Sent.',
      data: { user: { email: 'ada@example.com' } },
    });
    render(
      <ForgotPasswordCard requestPasswordReset={mocks.requestPasswordReset} />,
    );
    await submit();

    fireEvent.click(
      screen.getByRole('button', { name: 'Use a different email' }),
    );

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe(
      'ada@example.com',
    );
  });

  it('shows an error on the form', async () => {
    mocks.requestPasswordReset.mockResolvedValue({ error: 'Try later.' });
    render(
      <ForgotPasswordCard requestPasswordReset={mocks.requestPasswordReset} />,
    );

    await submit();

    expect(screen.getByRole('alert').textContent).toBe('Try later.');
  });

  it('sends the typed address to the server action', async () => {
    render(
      <ForgotPasswordCard requestPasswordReset={mocks.requestPasswordReset} />,
    );

    await submit('ada@example.com');

    expect(mocks.requestPasswordReset).toHaveBeenCalledTimes(1);
    const formData = mocks.requestPasswordReset.mock.calls[0]?.[1] as FormData;
    expect(formData.get('email')).toBe('ada@example.com');
  });

  it('refuses an empty address in the browser, with the same message and marking as the server', async () => {
    render(
      <ForgotPasswordCard requestPasswordReset={mocks.requestPasswordReset} />,
    );

    await submit('');

    expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Enter your email.');
    const email = screen.getByLabelText('Email');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe(alert.id);
    expect(document.activeElement).toBe(email);
  });
});
