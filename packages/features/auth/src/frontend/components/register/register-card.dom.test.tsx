import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  resendConfirmation: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

import {
  firstRefusal,
  registrationSchema,
  type AuthFieldName,
} from '@synapcity/domain-identity';
import { RegisterCard } from './register-card';

type Typed = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirm: string;
};
const VALID: Typed = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  password: 'Analytical1!',
  confirm: 'Analytical1!',
};

/** Each field's visible label, in the order the form shows them. */
const LABELS: Record<keyof Typed, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  password: 'Password',
  confirm: 'Confirm password',
};

/**
 * Types into each field, then submits. The form validates in the browser
 * first, so a test that wants the server's reply sends what the schema accepts.
 */
const submit = (typed: Typed = VALID) =>
  act(async () => {
    for (const [key, label] of Object.entries(LABELS) as [
      keyof Typed,
      string,
    ][]) {
      const value = typed[key];
      fireEvent.change(screen.getByLabelText(label, { exact: true }), {
        target: { value },
      });
    }
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
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Sign up',
    );
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByText('or continue with email')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
  });

  it('links to sign in and keeps the destination', () => {
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );

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
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );

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
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );
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
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );

    await submit();

    expect(screen.getByRole('alert').textContent).toBe('That email is taken.');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Sign up',
    );
  });

  it('still confirms when the accepted sign-up came back without an address to name', async () => {
    mocks.signUp.mockResolvedValue({
      success: true,
      message: 'We sent a confirmation link.',
    });
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next=""
      />,
    );

    await submit();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Check your email',
    );
    expect(screen.queryByText(/Requested for/)).toBeNull();
  });

  it.each<[string, Partial<Typed>]>([
    [
      'nothing typed',
      { firstName: '', lastName: '', email: '', password: '', confirm: '' },
    ],
    ['no first name', { firstName: '   ' }],
    ['an invalid first name', { firstName: 'Ada1' }],
    ['an invalid last name', { lastName: '<b>' }],
    ['a malformed email', { email: 'not-an-address' }],
    ['a short password', { password: 'short', confirm: 'short' }],
    [
      'a password missing a symbol',
      { password: 'Analytical1', confirm: 'Analytical1' },
    ],
    ['a confirmation that does not match', { confirm: 'Analytical1?' }],
    ['no confirmation', { confirm: '' }],
  ])(
    'refuses %s in the browser with the message and field the server would give',
    async (_label, change) => {
      const typed = { ...VALID, ...change };
      render(
        <RegisterCard
          signUp={mocks.signUp}
          resendConfirmation={mocks.resendConfirmation}
          signInWithOAuth={mocks.signInWithOAuth}
          next="/after"
        />,
      );

      await submit(typed);

      const parsed = registrationSchema.safeParse(typed);
      expect(parsed.success).toBe(false);
      const expected = firstRefusal(parsed.error!);
      expect(mocks.signUp).not.toHaveBeenCalled();
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toBe(expected.message);
      for (const [key, label] of Object.entries(LABELS)) {
        const field = screen.getByLabelText(label, { exact: true });
        const marked = expected.fields.includes(key as AuthFieldName);
        expect(field.getAttribute('aria-invalid')).toBe(marked ? 'true' : null);
      }
      const first = expected.fields[0] as keyof Typed;
      expect(document.activeElement).toBe(
        screen.getByLabelText(LABELS[first], { exact: true }),
      );
    },
  );

  it('reports the password rule once the names are valid', async () => {
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );

    await submit({ ...VALID, password: 'short', confirm: 'short' });

    expect(screen.getByRole('alert').textContent).toBe(
      'Use a password of at least 8 characters.',
    );
    expect(
      screen
        .getByLabelText('First name', { exact: true })
        .getAttribute('aria-invalid'),
    ).toBeNull();
    expect(
      screen
        .getByLabelText('Password', { exact: true })
        .getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('keeps what was typed in every field when the browser refuses', async () => {
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );

    await submit({ ...VALID, password: 'short', confirm: 'short' });

    for (const [key, value] of Object.entries({
      ...VALID,
      password: 'short',
      confirm: 'short',
    })) {
      expect(
        (
          screen.getByLabelText(LABELS[key as keyof Typed], {
            exact: true,
          }) as HTMLInputElement
        ).value,
      ).toBe(value);
    }
  });

  it('sends every field under the name the server action reads', async () => {
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );

    await submit();

    expect(mocks.signUp).toHaveBeenCalledTimes(1);
    const formData = mocks.signUp.mock.calls[0]?.[1] as FormData;
    expect(formData.get('next')).toBe('/after');
    expect(Object.fromEntries(formData)).toEqual({ next: '/after', ...VALID });
    // What the form sent is what the server's schema accepts, key for key.
    expect(
      registrationSchema.safeParse(Object.fromEntries(formData)).success,
    ).toBe(true);
    expect(formData.has('name')).toBe(false);
  });

  it('accepts a blank last name, which is optional', async () => {
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next=""
      />,
    );

    await submit({ ...VALID, lastName: '' });

    expect(mocks.signUp).toHaveBeenCalledTimes(1);
    const formData = mocks.signUp.mock.calls[0]?.[1] as FormData;
    expect(formData.get('firstName')).toBe('Ada');
    expect(formData.get('lastName')).toBe('');
  });
});
