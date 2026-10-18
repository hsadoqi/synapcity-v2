import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }));

vi.mock('@/features/auth/server/actions/actions', () => ({
  requestPasswordReset: mocks.requestPasswordReset,
}));

import { ForgotPasswordCard } from './forgot-password-card';

const submit = () =>
  act(async () => {
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
    render(<ForgotPasswordCard />);

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
    render(<ForgotPasswordCard expired />);

    expect(screen.getByText(/has expired or was already used/)).toBeTruthy();
  });

  it('gives the usual instructions otherwise', () => {
    render(<ForgotPasswordCard />);

    expect(screen.getByText(/we’ll send you a link/)).toBeTruthy();
    expect(screen.queryByText(/has expired/)).toBeNull();
  });

  it('confirms the request and offers a resend', async () => {
    mocks.requestPasswordReset.mockResolvedValue({
      success: true,
      message: 'If that account exists, we sent a link.',
      data: { user: { email: 'ada@example.com' } },
    });
    render(<ForgotPasswordCard />);

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
    render(<ForgotPasswordCard />);
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
    render(<ForgotPasswordCard />);

    await submit();

    expect(screen.getByRole('alert').textContent).toBe('Try later.');
  });
});
