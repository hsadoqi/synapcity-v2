import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type AuthState } from '../../../../contracts';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
} from '@synapcity/domain-identity';

const mocks = vi.hoisted(() => ({ updatePassword: vi.fn() }));

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
    render(
      <UpdatePasswordForm updatePassword={mocks.updatePassword} next="" />,
    );

    for (const label of ['New password', 'Confirm new password']) {
      expect(field(label).autocomplete).toBe('new-password');
      expect(field(label).minLength).toBe(MIN_PASSWORD_LENGTH);
    }
    expect(screen.getByText(PASSWORD_REQUIREMENTS)).toBeTruthy();
    expect(field('New password').form!.noValidate).toBe(true);
  });

  it('points a mismatch at the confirm field only', async () => {
    mocks.updatePassword.mockResolvedValue({
      error: 'The passwords do not match.',
      fields: ['confirm'],
    } satisfies AuthState);
    render(
      <UpdatePasswordForm updatePassword={mocks.updatePassword} next="" />,
    );

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

  it('keeps the button reachable but inert while updating', async () => {
    // Settled at the end: React entangles pending actions, so one left
    // hanging would hold back the next test's form reset.
    let settle!: (state: AuthState) => void;
    mocks.updatePassword.mockReturnValue(
      new Promise<AuthState>((resolve) => (settle = resolve)),
    );
    render(
      <UpdatePasswordForm updatePassword={mocks.updatePassword} next="" />,
    );

    try {
      await submit();

      const button = screen.getByRole('button', { name: 'Updating…' });
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
      expect(mocks.updatePassword).toHaveBeenCalledTimes(1);
    } finally {
      await act(async () => settle({}));
    }
  });

  it('never refills a password after a refusal', async () => {
    mocks.updatePassword.mockResolvedValue({
      error: 'Use a password of at least 8 characters.',
      fields: ['password'],
    } satisfies AuthState);
    render(
      <UpdatePasswordForm updatePassword={mocks.updatePassword} next="" />,
    );
    fireEvent.change(field('New password'), { target: { value: 'short' } });

    await submit();

    expect(field('New password').value).toBe('');
  });
});
