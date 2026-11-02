import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuthState } from '../../../../contracts';
import { ForgotPasswordForm } from './forgot-password-form';

const show = (state: AuthState = {}, pending = false, action = vi.fn()) =>
  render(
    <ForgotPasswordForm state={state} formAction={action} pending={pending} />,
  );
const email = () => screen.getByLabelText('Email') as HTMLInputElement;

describe('ForgotPasswordForm', () => {
  it('asks for just an email, labelled, with the right autofill', () => {
    show();

    expect(email().type).toBe('email');
    expect(email().autocomplete).toBe('email');
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(email().form!.noValidate).toBe(true);
  });

  it('refills the address and marks it when the request is refused', () => {
    show({
      error: 'Enter your email.',
      fields: ['email'],
      data: { user: { email: 'ada@example.com' } },
    });

    expect(email().value).toBe('ada@example.com');
    expect(email().getAttribute('aria-invalid')).toBe('true');
    expect(email().getAttribute('aria-describedby')).toBe(
      screen.getByRole('alert').id,
    );
  });

  it('shows progress while sending, keeping the button reachable but inert', async () => {
    const action = vi.fn();
    show({}, true, action);

    // A valid address, so only the pending state can hold the submit back.
    fireEvent.change(email(), { target: { value: 'ada@example.com' } });
    const button = screen.getByRole('button', { name: 'Sending…' });
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.tabIndex).toBe(0);
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(fireEvent.keyDown(button, { key: 'Enter' })).toBe(false);
    expect(fireEvent.keyDown(button, { key: ' ' })).toBe(false);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(action).not.toHaveBeenCalled();
  });

  it('sends when not pending', async () => {
    const action = vi.fn();
    show({}, false, action);

    fireEvent.change(email(), { target: { value: 'ada@example.com' } });
    const button = screen.getByRole('button', { name: 'Send reset link' });
    expect(button.getAttribute('aria-disabled')).not.toBe('true');
    await act(async () => {
      fireEvent.click(button);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });
});
