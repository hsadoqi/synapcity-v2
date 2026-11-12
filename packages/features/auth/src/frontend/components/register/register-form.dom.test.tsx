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
  screen.getByLabelText(label, { exact: true }) as HTMLInputElement;

const fillValid = () => {
  fireEvent.change(field('First name'), { target: { value: 'Ada' } });
  fireEvent.change(field('Email'), { target: { value: 'ada@example.com' } });
  fireEvent.change(field('Password'), { target: { value: 'Analytical1!' } });
  fireEvent.change(field('Confirm password'), {
    target: { value: 'Analytical1!' },
  });
};

describe('RegisterForm', () => {
  it('asks for a first name, an optional last name, the email and the password twice', () => {
    show();

    expect(field('First name').name).toBe('firstName');
    expect(field('First name').autocomplete).toBe('given-name');
    expect(field('First name').required).toBe(true);
    expect(field('First name').maxLength).toBe(MAX_NAME_LENGTH);
    expect(field('Last name').name).toBe('lastName');
    expect(field('Last name').autocomplete).toBe('family-name');
    expect(field('Last name').required).toBe(false);
    expect(field('Email').autocomplete).toBe('email');
    expect(field('Password').autocomplete).toBe('new-password');
    expect(field('Password').minLength).toBe(MIN_PASSWORD_LENGTH);
    expect(field('Confirm password').name).toBe('confirm');
    expect(field('Confirm password').autocomplete).toBe('new-password');
    expect(screen.queryByLabelText('Name', { exact: true })).toBeNull();
    expect(screen.getByText(PASSWORD_REQUIREMENTS)).toBeTruthy();
  });

  it('describes each field by its rule until an error replaces it', () => {
    show();
    expect(field('Last name').getAttribute('aria-describedby')).toBe(
      'lastName-hint',
    );
    expect(field('Password').getAttribute('aria-describedby')).toBe(
      'password-hint',
    );
  });

  it("turns off the browser's own validation, so the schema decides", () => {
    show();
    expect(field('First name').form!.noValidate).toBe(true);
  });

  it('marks the field the error is about and links it to the message', () => {
    show({
      error: 'Enter your first name.',
      fields: ['firstName'],
      data: { user: { email: 'ada@example.com', firstName: '' } },
    });

    const alert = screen.getByRole('alert');
    expect(field('First name').getAttribute('aria-invalid')).toBe('true');
    expect(field('First name').getAttribute('aria-describedby')).toBe(alert.id);
    expect(field('Last name').getAttribute('aria-invalid')).toBeNull();
    expect(field('Email').getAttribute('aria-invalid')).toBeNull();
    expect(field('Email').value).toBe('ada@example.com');
  });

  it('refills the names and email the server echoed, never the passwords', () => {
    show({
      error: 'That email is taken.',
      fields: ['email'],
      data: {
        user: {
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
      },
    });

    expect(field('First name').value).toBe('Ada');
    expect(field('Last name').value).toBe('Lovelace');
    expect(field('Email').value).toBe('ada@example.com');
    expect(field('Password').value).toBe('');
    expect(field('Confirm password').value).toBe('');
  });

  it('carries the destination and shows progress while creating', () => {
    const { container } = show({}, true);

    expect(
      (container.querySelector('input[name="next"]') as HTMLInputElement).value,
    ).toBe('/after');
    const button = screen.getByRole('button', { name: 'Creating account…' });
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('keeps the button reachable but inert while creating', async () => {
    const action = vi.fn();
    show({}, true, action);
    // Valid fields, so only the pending state can hold the submit back.
    fillValid();

    const button = screen.getByRole('button', { name: 'Creating account…' });
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(fireEvent.keyDown(button, { key: 'Enter' })).toBe(false);
    expect(fireEvent.keyDown(button, { key: ' ' })).toBe(false);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(action).not.toHaveBeenCalled();
  });

  it('hands a valid submit, without a last name, to the action it was given', async () => {
    const action = vi.fn();
    show({}, false, action);

    fillValid();
    await act(async () => {
      fireEvent.submit(field('First name').form!);
    });

    expect(action).toHaveBeenCalledTimes(1);
    const sent = action.mock.calls[0]?.[0] as FormData;
    expect(sent.get('firstName')).toBe('Ada');
    expect(sent.get('lastName')).toBe('');
  });
});
