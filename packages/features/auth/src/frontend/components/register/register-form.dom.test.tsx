import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  MAX_NAME_LENGTH,
} from '@synapcity/domain-identity';
import type { AuthState } from '../../../contracts';
import { RegisterForm } from './register-form';

const show = (state: AuthState = {}, pending = false, action = vi.fn()) =>
  render(
    <RegisterForm
      next="/after"
      state={state}
      formAction={action}
      pending={pending}
    />,
  );

const field = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement;

describe('RegisterForm', () => {
  it('labels every field and states the rules for name and password', () => {
    show();

    expect(field('Name').autocomplete).toBe('name');
    expect(field('Name').maxLength).toBe(MAX_NAME_LENGTH);
    expect(field('Email').autocomplete).toBe('email');
    expect(field('Password').autocomplete).toBe('new-password');
    expect(field('Password').minLength).toBe(MIN_PASSWORD_LENGTH);
    expect(
      screen.getByText(`Up to ${MAX_NAME_LENGTH} characters.`),
    ).toBeTruthy();
    expect(screen.getByText(PASSWORD_REQUIREMENTS)).toBeTruthy();
  });

  it('describes each field by its rule until an error replaces it', () => {
    show();
    expect(field('Name').getAttribute('aria-describedby')).toBe('name-hint');
    expect(field('Password').getAttribute('aria-describedby')).toBe(
      'password-hint',
    );
  });

  it("turns off the browser's own validation, so the schema decides", () => {
    show();
    expect(field('Name').form!.noValidate).toBe(true);
  });

  it('marks the field the error is about and links it to the message', () => {
    show({
      error: 'Enter your name.',
      fields: ['name'],
      data: { user: { email: 'ada@example.com', name: '' } },
    });

    const alert = screen.getByRole('alert');
    expect(field('Name').getAttribute('aria-invalid')).toBe('true');
    expect(field('Name').getAttribute('aria-describedby')).toBe(alert.id);
    expect(field('Email').getAttribute('aria-invalid')).toBeNull();
    expect(field('Email').value).toBe('ada@example.com');
    expect(field('Name').hasAttribute('aria-describedby')).toBe(true);
  });

  it('carries the destination and shows progress while creating', () => {
    const { container } = show({}, true);

    expect(
      (container.querySelector('input[name="next"]') as HTMLInputElement).value,
    ).toBe('/after');
    const button = screen.getByRole('button', { name: 'Creating account…' });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('hands a valid submit to the action it was given', async () => {
    const action = vi.fn();
    show({}, false, action);

    fireEvent.change(field('Name'), { target: { value: 'Ada' } });
    fireEvent.change(field('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(field('Password'), { target: { value: 'Analytical1!' } });
    await act(async () => {
      fireEvent.submit(field('Name').form!);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });
});
