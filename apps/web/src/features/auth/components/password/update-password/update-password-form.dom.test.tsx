import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MIN_PASSWORD_LENGTH, type AuthState } from '@/features/auth/types';

const mocks = vi.hoisted(() => ({ updatePassword: vi.fn() }));
vi.mock('@/features/auth/server/actions', () => ({
  updatePassword: mocks.updatePassword,
}));

import { UpdatePasswordForm } from './update-password-form';

const field = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement;
const submit = () =>
  act(async () => {
    fireEvent.submit(field('New password').form!);
  });

describe('UpdatePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('labels both password fields as new passwords and states the minimum', () => {
    render(<UpdatePasswordForm />);

    for (const label of ['New password', 'Confirm new password']) {
      expect(field(label).autocomplete).toBe('new-password');
      expect(field(label).minLength).toBe(MIN_PASSWORD_LENGTH);
    }
    expect(
      screen.getByText(`Use at least ${MIN_PASSWORD_LENGTH} characters.`),
    ).toBeTruthy();
    expect(field('New password').form!.noValidate).toBe(true);
  });

  it('points a mismatch at the confirm field only', async () => {
    mocks.updatePassword.mockResolvedValue({
      error: 'The passwords do not match.',
      fields: ['confirm'],
    } satisfies AuthState);
    render(<UpdatePasswordForm />);

    await submit();

    expect(field('Confirm new password').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(field('New password').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByRole('alert').textContent).toBe(
      'The passwords do not match.',
    );
    expect(document.activeElement).toBe(field('Confirm new password'));
  });

  it('never refills a password after a refusal', async () => {
    mocks.updatePassword.mockResolvedValue({
      error: 'Use a password of at least 8 characters.',
      fields: ['password'],
    } satisfies AuthState);
    render(<UpdatePasswordForm />);
    fireEvent.change(field('New password'), { target: { value: 'short' } });

    await submit();

    expect(field('New password').value).toBe('');
  });
});
