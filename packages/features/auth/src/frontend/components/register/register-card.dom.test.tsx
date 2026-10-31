import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  resendConfirmation: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

import { firstRefusal, signUpSchema } from '@synapcity/domain-identity';
import { RegisterCard } from './register-card';

type Typed = { name: string; email: string; password: string };
const VALID: Typed = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Analytical1!',
};

/**
 * Types into each field, then submits. The form validates in the browser
 * first, so a test that wants the server's reply sends what the schema accepts.
 */
const submit = (typed: Typed = VALID) =>
  act(async () => {
    for (const [label, value] of [
      ['Name', typed.name],
      ['Email', typed.email],
      ['Password', typed.password],
    ] as const) {
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

  it.each<[string, Typed]>([
    ['nothing typed', { name: '', email: '', password: '' }],
    ['only a name', { name: 'Ada', email: '', password: '' }],
    [
      'no name',
      { name: '   ', email: 'ada@example.com', password: 'Analytical1!' },
    ],
    [
      'a short password',
      { name: 'Ada', email: 'ada@example.com', password: 'short' },
    ],
    [
      'a password missing a symbol',
      { name: 'Ada', email: 'ada@example.com', password: 'Analytical1' },
    ],
  ])(
    'refuses %s in the browser with the message and field the server would give',
    async (_label, typed) => {
      render(
        <RegisterCard
          signUp={mocks.signUp}
          resendConfirmation={mocks.resendConfirmation}
          signInWithOAuth={mocks.signInWithOAuth}
          next="/after"
        />,
      );

      await submit(typed);

      const parsed = signUpSchema.safeParse(typed);
      expect(parsed.success).toBe(false);
      const expected = firstRefusal(parsed.error!);
      expect(mocks.signUp).not.toHaveBeenCalled();
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toBe(expected.message);
      for (const label of ['Name', 'Email', 'Password']) {
        const field = screen.getByLabelText(label, { exact: true });
        const marked = expected.fields.includes(
          label.toLowerCase() as (typeof expected.fields)[number],
        );
        expect(field.getAttribute('aria-invalid')).toBe(marked ? 'true' : null);
      }
      const first = screen.getByLabelText(
        expected.fields[0] === 'name'
          ? 'Name'
          : expected.fields[0] === 'email'
            ? 'Email'
            : 'Password',
        { exact: true },
      );
      expect(document.activeElement).toBe(first);
    },
  );

  it('keeps what was typed in every field when the browser refuses', async () => {
    render(
      <RegisterCard
        signUp={mocks.signUp}
        resendConfirmation={mocks.resendConfirmation}
        signInWithOAuth={mocks.signInWithOAuth}
        next="/after"
      />,
    );

    await submit({ name: 'Ada', email: 'ada@example.com', password: 'short' });

    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'Ada',
    );
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe(
      'ada@example.com',
    );
    expect(
      (screen.getByLabelText('Password', { exact: true }) as HTMLInputElement)
        .value,
    ).toBe('short');
  });

  it('sends the destination with a valid sign-up', async () => {
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
    expect(formData.get('email')).toBe('ada@example.com');
  });
});
