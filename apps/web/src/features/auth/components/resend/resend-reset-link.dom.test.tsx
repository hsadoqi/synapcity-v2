import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }));

vi.mock('@/features/auth/server/actions/actions', () => ({
  requestPasswordReset: mocks.requestPasswordReset,
}));

import { ResendResetLink } from './resend-reset-link';

const button = () =>
  screen.getByRole('button', { name: /Resend link|Sending/ });
const submit = () =>
  act(async () => {
    fireEvent.submit(button().closest('form')!);
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requestPasswordReset.mockResolvedValue({});
});

describe('ResendResetLink', () => {
  it('carries the email in a hidden field', () => {
    const { container } = render(<ResendResetLink email="ada@example.com" />);

    expect(
      (container.querySelector('input[name="email"]') as HTMLInputElement)
        .value,
    ).toBe('ada@example.com');
  });

  it('is not free until the first email has had time to arrive', () => {
    render(<ResendResetLink email="ada@example.com" />);

    expect(button().getAttribute('aria-disabled')).toBe('true');
    expect(button().getAttribute('aria-describedby')).toBe('resend-reset-hint');
  });

  it('sends the email to the reset action', async () => {
    render(<ResendResetLink email="ada@example.com" />);

    await submit();

    const formData = mocks.requestPasswordReset.mock.calls[0]![1] as FormData;
    expect(formData.get('email')).toBe('ada@example.com');
  });

  it('says a second request went out, whatever the action replied', async () => {
    mocks.requestPasswordReset.mockResolvedValue({
      success: true,
      message: 'If that account exists, we sent a link.',
    });
    render(<ResendResetLink email="ada@example.com" />);

    await submit();

    expect(screen.getByRole('status').textContent).toBe(
      'Requested again. It can take a minute to arrive.',
    );
  });

  it('shows an error from the action as it is', async () => {
    mocks.requestPasswordReset.mockResolvedValue({ error: 'Try later.' });
    render(<ResendResetLink email="ada@example.com" />);

    await submit();

    expect(screen.getByRole('alert').textContent).toBe('Try later.');
  });
});
