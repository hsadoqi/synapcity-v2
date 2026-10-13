'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { authErrorMessage } from '@/lib/auth/error-messages';
import { getOrigin } from '@/lib/auth/origin';
import { safeNextPath } from '@/lib/auth/safe-next';
import { createClient } from '@/lib/supabase/server';

/**
 * `email` echoes the submitted address so a failed submit can refill the field:
 * React 19 resets a form after its action finishes. Passwords are never echoed.
 */
export type AuthState = {
  error?: string;
  message?: string;
  success?: boolean;
  email?: string;
};

const MIN_PASSWORD_LENGTH = 8;
const OAUTH_PROVIDERS = ['google', 'github'] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

function callbackUrl(origin: string, next: string): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signInWithPassword(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const password = field(formData, 'password');
  if (!email || !password) {
    return { error: 'Enter your email and password.', email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error.code), email };

  revalidatePath('/', 'layout');
  redirect(safeNextPath(field(formData, 'next')));
}

export async function signUp(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const password = field(formData, 'password');
  const next = safeNextPath(field(formData, 'next'));
  if (!email) return { error: 'Enter your email.', email };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
      email,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callbackUrl(getOrigin(), next) },
  });
  if (error) return { error: authErrorMessage(error.code), email };

  // A session exists only when the project does not require email
  // confirmation. ADR-0006 requires it, so this is the unusual branch.
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect(next);
  }
  return {
    message: `We sent a confirmation link to ${email}. Open it to finish creating your account.`,
  };
}

export async function requestPasswordReset(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  if (!email) return { error: 'Enter your email.', email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(getOrigin(), '/auth/update-password'),
  });
  if (error?.code === 'over_email_send_rate_limit') {
    return { error: authErrorMessage(error.code), email };
  }

  // The same reply whether or not the address has an account, so the form
  // cannot be used to discover which emails are registered.
  return {
    success: true,
    message: 'If that email has an account, a reset link is on its way.',
    email,
  };
}

export async function updatePassword(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = field(formData, 'password');
  const confirm = field(formData, 'confirm');
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (password !== confirm) return { error: 'The passwords do not match.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error.code) };

  revalidatePath('/', 'layout');
  redirect(safeNextPath(null));
}

export async function signInWithOAuth(formData: FormData): Promise<void> {
  const provider = field(formData, 'provider');
  if (!isOAuthProvider(provider)) redirect('/auth/error');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl(
        getOrigin(),
        safeNextPath(field(formData, 'next')),
      ),
    },
  });
  if (error || !data.url) redirect('/auth/error');

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/');
}
