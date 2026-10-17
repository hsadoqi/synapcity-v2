import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@/features/auth/types';

const mocks = vi.hoisted(() => ({ resendEmailChange: vi.fn() }));
vi.mock('@/features/auth/server/actions/actions', () => ({
  resendEmailChange: mocks.resendEmailChange,
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/u1/settings' }));

import { ResendEmailChange } from './resend-email-change';

const submit = () =>
  act(async () => {
    fireEvent.submit(
      screen
        .getByRole('button', { name: /Resend link|Sending…/ })
        .closest('form')!,
    );
  });

describe('ResendEmailChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a button that asks the server to send again, and sends no address of its own', async () => {
    mocks.resendEmailChange.mockResolvedValue({
      success: true,
      message: 'Requested again. It can take a minute to arrive.',
      data: { user: { email: 'grace@example.com' } },
    } satisfies AuthState);
    const { container } = render(<ResendEmailChange justRequested={false} />);

    await submit();

    expect(mocks.resendEmailChange).toHaveBeenCalledTimes(1);
    const formData = mocks.resendEmailChange.mock.calls[0]![1] as FormData;
    expect([...formData.keys()]).toEqual([]);
    expect(container.querySelector('input')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe(
      'Requested again. It can take a minute to arrive.',
    );
  });

  it('asks you to wait when the first email has only just gone out', () => {
    render(<ResendEmailChange justRequested />);

    expect(screen.getByText('You can request another in 60s.')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Resend link' })
        .getAttribute('aria-disabled'),
    ).toBe('true');
  });

  it('is free to use when the email went out earlier', () => {
    render(<ResendEmailChange justRequested={false} />);

    expect(screen.queryByText(/You can request another/)).toBeNull();
    expect(
      screen
        .getByRole('button', { name: 'Resend link' })
        .getAttribute('aria-disabled'),
    ).toBeNull();
  });

  it('shows a refusal, such as a rate limit', async () => {
    mocks.resendEmailChange.mockResolvedValue({
      error: 'Too many attempts. Wait a few minutes and try again.',
    } satisfies AuthState);
    render(<ResendEmailChange justRequested={false} />);

    await submit();

    expect(screen.getByRole('alert').textContent).toBe(
      'Too many attempts. Wait a few minutes and try again.',
    );
  });

  it('offers a way back in when the session has gone', async () => {
    mocks.resendEmailChange.mockResolvedValue({
      error: 'For your security, sign out, sign in again, then try once more.',
      signedOut: true,
    } satisfies AuthState);
    render(<ResendEmailChange justRequested={false} />);

    await submit();

    expect(
      screen.getByRole('link', { name: 'Sign in again' }).getAttribute('href'),
    ).toBe('/auth/login?next=%2Fu1%2Fsettings');
  });
});
