import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  resendConfirmation: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock('@/features/auth/server/actions/actions', () => ({
  signUp: mocks.signUp,
  resendConfirmation: mocks.resendConfirmation,
  signInWithOAuth: mocks.signInWithOAuth,
}));

import { RegisterCard } from './register-card';

const submit = () =>
  act(async () => {
    fireEvent.submit(
      screen.getByRole('button', { name: 'Create account' }).closest('form')!,
    );
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signUp.mockResolvedValue({});
});

describe('RegisterCard', () => {
  it('is the sign-up page with one h1, the form and the social options', () => {
    render(<RegisterCard next="/after" />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Sign up',
    );
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByText('or continue with email')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
  });

  it('links to sign in and keeps the destination', () => {
    render(<RegisterCard next="/after" />);

    expect(
      screen
        .getByRole('link', { name: 'Already have an account? Sign in' })
        .getAttribute('href'),
    ).toBe(`/auth/login?next=${encodeURIComponent('/after')}`);
  });

  it('turns into a confirmation once the sign-up is accepted', async () => {
    mocks.signUp.mockResolvedValue({
      success: true,
      message: 'We sent a confirmation link.',
      data: { user: { email: 'ada@example.com' } },
    });
    render(<RegisterCard next="/after" />);

    await submit();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Check your email',
    );
    expect(screen.getByText('We sent a confirmation link.')).toBeTruthy();
    expect(screen.getByText(/Requested for ada@example.com/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Resend link' })).toBeTruthy();
    expect(screen.queryByLabelText('Email')).toBeNull();
  });

  it('returns to the form, keeping the address, to fix a typo', async () => {
    mocks.signUp.mockResolvedValue({
      success: true,
      message: 'Sent.',
      data: { user: { email: 'ada@example.com' } },
    });
    render(<RegisterCard next="/after" />);
    await submit();

    fireEvent.click(
      screen.getByRole('button', { name: 'Use a different email' }),
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Sign up',
    );
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe(
      'ada@example.com',
    );
  });

  it('shows a failed sign-up on the form, not as a confirmation', async () => {
    mocks.signUp.mockResolvedValue({ error: 'That email is taken.' });
    render(<RegisterCard next="/after" />);

    await submit();

    expect(screen.getByRole('alert').textContent).toBe('That email is taken.');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Sign up',
    );
  });
});
