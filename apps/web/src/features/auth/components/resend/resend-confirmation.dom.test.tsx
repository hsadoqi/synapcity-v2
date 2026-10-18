import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resendConfirmation: vi.fn() }));

vi.mock('@/features/auth/server/actions/actions', () => ({
  resendConfirmation: mocks.resendConfirmation,
}));

import { ResendConfirmation } from './resend-confirmation';

const show = (props = {}) =>
  render(
    <ResendConfirmation email="ada@example.com" next="/after" {...props} />,
  );
const button = (name = 'Resend link') => screen.getByRole('button', { name });
const submit = () =>
  act(async () => {
    fireEvent.submit(button().closest('form')!);
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resendConfirmation.mockResolvedValue({});
});
afterEach(() => vi.useRealTimers());

describe('ResendConfirmation', () => {
  it('carries the email and next in hidden fields', () => {
    const { container } = show();

    expect(
      (container.querySelector('input[name="email"]') as HTMLInputElement)
        .value,
    ).toBe('ada@example.com');
    expect(
      (container.querySelector('input[name="next"]') as HTMLInputElement).value,
    ).toBe('/after');
  });

  it('makes the first request wait, after an email was just sent', () => {
    show();

    expect(button().getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText(/You can request another in 60s/)).toBeTruthy();
  });

  it('is free straight away when no email was just sent', () => {
    show({ waitFirst: false });

    expect(button().hasAttribute('aria-disabled')).toBe(false);
  });

  it('counts down and frees the button', () => {
    vi.useFakeTimers();
    show();

    // The clock re-arms after each render, so step it one second at a time.
    for (let second = 0; second < 60; second++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(button().hasAttribute('aria-disabled')).toBe(false);
    expect(screen.queryByText(/You can request another/)).toBeNull();
  });

  it('uses a custom label', () => {
    show({ label: 'Send it again', waitFirst: false });

    expect(button('Send it again')).toBeTruthy();
  });

  it('sends the form data to the action', async () => {
    show({ waitFirst: false });

    await submit();

    const formData = mocks.resendConfirmation.mock.calls[0]![1] as FormData;
    expect(formData.get('email')).toBe('ada@example.com');
    expect(formData.get('next')).toBe('/after');
  });

  it('shows the action’s message and restarts the wait', async () => {
    mocks.resendConfirmation.mockResolvedValue({
      success: true,
      message: 'Sent again.',
    });
    show({ waitFirst: false });

    await submit();

    expect(screen.getByRole('status').textContent).toBe('Sent again.');
    expect(button().getAttribute('aria-disabled')).toBe('true');
  });

  it('shows an error from the action', async () => {
    mocks.resendConfirmation.mockResolvedValue({ error: 'Try later.' });
    show({ waitFirst: false });

    await submit();

    expect(screen.getByRole('alert').textContent).toBe('Try later.');
  });
});
