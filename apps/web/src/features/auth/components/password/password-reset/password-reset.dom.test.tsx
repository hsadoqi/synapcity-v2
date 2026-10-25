import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@synapcity/features-auth/contracts';

const mocks = vi.hoisted(() => ({ requestOwnPasswordReset: vi.fn() }));
vi.mock('@/features/auth/server/actions/actions', () => ({
  requestOwnPasswordReset: mocks.requestOwnPasswordReset,
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/u1/settings' }));

import { PasswordReset } from './password-reset';

const send = () =>
  act(async () => {
    fireEvent.submit(
      screen
        .getByRole('button', { name: /Send reset link|Send again|Sending…/ })
        .closest('form')!,
    );
  });

describe('PasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('explains what it will do before anything is sent', () => {
    render(<PasswordReset />);

    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByText(/does not change until you do/i)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Send reset link' }),
    ).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('takes no password and no address: nothing to type, so nothing to mistype or leak', () => {
    const { container } = render(<PasswordReset />);

    expect(container.querySelector('input')).toBeNull();
    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });

  it('asks the server to send, with nothing in the form', async () => {
    mocks.requestOwnPasswordReset.mockResolvedValue({});
    render(<PasswordReset />);

    await send();

    const formData = mocks.requestOwnPasswordReset.mock
      .calls[0]![1] as FormData;
    expect([...formData.keys()]).toEqual([]);
  });

  it('says where the link went, then offers to send again after a wait', async () => {
    mocks.requestOwnPasswordReset.mockResolvedValue({
      success: true,
      message:
        'We sent a link to ada@example.com. Open it to choose a new password.',
      data: { user: { email: 'ada@example.com' } },
    } satisfies AuthState);
    render(<PasswordReset />);

    await send();

    expect(screen.getByRole('status').textContent).toContain(
      'We sent a link to ada@example.com.',
    );
    expect(screen.getByRole('status').textContent).toMatch(/spam folder/i);
    const again = screen.getByRole('button', { name: 'Send again' });
    expect(again.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('You can request another in 60s.')).toBeTruthy();
  });

  it('shows a refusal, and keeps the first button', async () => {
    mocks.requestOwnPasswordReset.mockResolvedValue({
      error: 'Too many attempts. Wait a few minutes and try again.',
    } satisfies AuthState);
    render(<PasswordReset />);

    await send();

    expect(screen.getByRole('alert').textContent).toBe(
      'Too many attempts. Wait a few minutes and try again.',
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Send reset link' }),
    ).toBeTruthy();
  });

  it('is not waiting before a first request', () => {
    render(<PasswordReset />);

    expect(screen.queryByText(/You can request another/)).toBeNull();
    expect(
      screen
        .getByRole('button', { name: 'Send reset link' })
        .getAttribute('aria-disabled'),
    ).toBeNull();
  });

  it('offers a way back in when the session has gone, and not for other errors', async () => {
    mocks.requestOwnPasswordReset.mockResolvedValue({
      error: 'For your security, sign out, sign in again, then try once more.',
      signedOut: true,
    } satisfies AuthState);
    render(<PasswordReset />);

    await send();

    expect(
      screen.getByRole('link', { name: 'Sign in again' }).getAttribute('href'),
    ).toBe('/auth/login?next=%2Fu1%2Fsettings');
  });

  it('shows no sign-in link for an ordinary refusal', async () => {
    mocks.requestOwnPasswordReset.mockResolvedValue({
      error: 'Too many attempts. Wait a few minutes and try again.',
    } satisfies AuthState);
    render(<PasswordReset />);

    await send();

    expect(screen.queryByRole('link', { name: 'Sign in again' })).toBeNull();
  });
});
