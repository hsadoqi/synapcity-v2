import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The register form from the feature package, wired to the real `signUp`
 * Server Action as the page wires it. Only the Supabase client is replaced, so
 * a form that sends a field the action does not read (or names it differently)
 * fails here, not only in the end-to-end suite.
 */
const supabase = vi.hoisted(() => ({
  signUp: vi.fn(),
  resend: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`unexpected redirect to ${url}`);
  },
  usePathname: () => '/auth/register',
}));
vi.mock('@/features/auth/server/site-origin', () => ({
  getOrigin: () => 'https://app.test',
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: supabase }),
}));

import { RegisterCard } from '@synapcity/features-auth/frontend';
import {
  resendConfirmation,
  signInWithOAuth,
  signUp,
} from '@/features/auth/server/actions/actions';

const STRONG = 'Analytical1!';

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  });

const submit = () =>
  act(async () => {
    fireEvent.submit(
      screen.getByRole('button', { name: 'Create account' }).closest('form')!,
    );
  });

beforeEach(() => {
  vi.clearAllMocks();
  supabase.signUp.mockResolvedValue({
    data: { session: null, user: { id: 'user-1' } },
    error: null,
  });
  render(
    <RegisterCard
      next="/after"
      signUp={signUp}
      resendConfirmation={resendConfirmation}
      signInWithOAuth={signInWithOAuth}
    />,
  );
});

describe('the register page', () => {
  it('registers with the structured names and asks the person to confirm their email', async () => {
    type('First name', ' Ada ');
    type('Last name', 'Lovelace');
    type('Email', 'ada@example.com');
    type('Password', STRONG);
    type('Confirm password', STRONG);

    await submit();

    expect(supabase.signUp).toHaveBeenCalledExactlyOnceWith({
      email: 'ada@example.com',
      password: STRONG,
      options: {
        emailRedirectTo:
          'https://app.test/auth/callback?next=%2Fafter&flow=confirm',
        data: { first_name: 'Ada', last_name: 'Lovelace' },
      },
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Check your email',
    );
    expect(screen.getByText(/Requested for ada@example.com/)).toBeTruthy();
  });

  it('registers without a last name', async () => {
    type('First name', 'Ada');
    type('Email', 'ada@example.com');
    type('Password', STRONG);
    type('Confirm password', STRONG);

    await submit();

    expect(supabase.signUp.mock.calls[0]?.[0].options.data).toEqual({
      first_name: 'Ada',
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Check your email',
    );
  });

  it('refuses a missing first name on that field without reaching Supabase', async () => {
    type('Email', 'ada@example.com');
    type('Password', STRONG);
    type('Confirm password', STRONG);

    await submit();

    expect(screen.getByRole('alert').textContent).toBe(
      'Enter your first name.',
    );
    expect(
      screen
        .getByLabelText('First name', { exact: true })
        .getAttribute('aria-invalid'),
    ).toBe('true');
    expect(supabase.signUp).not.toHaveBeenCalled();
  });
});
