'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { authErrorPath, callbackUrl } from '@/lib/auth/auth-flow/auth-flow';
import {
  authFailure,
  authSuccess,
  type AuthState,
} from '@/lib/auth/auth-state/auth-state';
import {
  authErrorFields,
  authErrorMessage,
  isRateLimited,
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/error-messages/error-messages';
import { field } from '@/lib/auth/form-data/form-data';
import { homePathFor } from '@/lib/auth/home-path/home-path';
import { checkName } from '@/lib/auth/name/name';
import { getOrigin } from '@/lib/auth/origin/origin';
import { safeNextPath } from '@/lib/auth/safe-next/safe-next';
import { createClient } from '@/lib/supabase/server';

const OAUTH_PROVIDERS = ['google', 'github'] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

const ENTER_EMAIL = 'Enter your email.';

export async function signInWithPassword(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const password = field(formData, 'password');
  if (!email || !password) {
    return authFailure('Enter your email and password.', { email }, [
      ...(email ? [] : (['email'] as const)),
      ...(password ? [] : (['password'] as const)),
    ]);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error)
    return {
      ...authFailure(
        authErrorMessage(error.code),
        { email },
        authErrorFields(error.code),
      ),
      unconfirmed: error.code === 'email_not_confirmed',
    };

  revalidatePath('/', 'layout');
  redirect(safeNextPath(field(formData, 'next'), homePathFor(data.user.id)));
}

export async function signUp(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const password = field(formData, 'password');
  // Empty when the visitor gave no destination: the callback then falls back
  // to the new user's own home.
  const next = safeNextPath(field(formData, 'next'), '');
  const { name, error: nameError } = checkName(field(formData, 'name'));
  const user = { email, name };
  if (!email) return authFailure(ENTER_EMAIL, user, ['email']);
  if (nameError) return authFailure(nameError, user, ['name']);
  if (password.length < MIN_PASSWORD_LENGTH) {
    return authFailure(PASSWORD_TOO_SHORT_MESSAGE, user, ['password']);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl(getOrigin(), next, 'confirm'),
      // Same key OAuth providers fill, so one reader covers both sign-up paths.
      data: { full_name: name },
    },
  });
  if (error)
    return authFailure(
      authErrorMessage(error.code),
      user,
      authErrorFields(error.code),
    );

  // A session exists only when the project does not require email
  // confirmation. ADR-0006 requires it, so this is the unusual branch.
  if (data.session && data.user) {
    revalidatePath('/', 'layout');
    redirect(next || homePathFor(data.user.id));
  }
  // Worded so it stays true when the address already has an account, in which
  // case Supabase sends nothing (it hides that to prevent account discovery).
  // Do not say a link "was sent".
  return authSuccess(
    'Check your email for a link to confirm your account. If you already have an account, sign in or reset your password instead.',
    user,
  );
}

export async function resendConfirmation(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const next = safeNextPath(field(formData, 'next'), '');
  if (!email) return authFailure(ENTER_EMAIL, { email }, ['email']);

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: callbackUrl(getOrigin(), next, 'confirm') },
  });
  if (isRateLimited(error?.code)) {
    return authFailure(authErrorMessage(error?.code), { email });
  }

  // The same reply whether or not the address has a pending sign-up, like the
  // other forms, so this cannot be used to discover registered emails.
  return authSuccess('Requested again. It can take a minute to arrive.', {
    email,
  });
}

export async function requestPasswordReset(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const user = { email, name: '' };
  if (!email) return authFailure(ENTER_EMAIL, user, ['email']);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(getOrigin(), '/auth/update-password', 'reset'),
  });
  // Only the email limit is reported here; `resendConfirmation` also reports
  // the request limit. Kept as it was: ADR-0008 and the auth-refactor plan say
  // to preserve recovery's failure policy, so changing it is the owner's call.
  if (error?.code === 'over_email_send_rate_limit') {
    return authFailure(authErrorMessage(error?.code), user);
  }

  // The same reply whether or not the address has an account, so the form
  // cannot be used to discover which emails are registered.
  return authSuccess(
    'If that email has an account, a reset link is on its way.',
    user,
  );
}

export async function updatePassword(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = field(formData, 'password');
  const confirm = field(formData, 'confirm');
  const user = { email: '', name: '' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return authFailure(PASSWORD_TOO_SHORT_MESSAGE, user, ['password']);
  }
  if (password !== confirm) {
    return authFailure('The passwords do not match.', user, ['confirm']);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error)
    return authFailure(
      authErrorMessage(error.code),
      user,
      authErrorFields(error.code),
    );

  revalidatePath('/', 'layout');
  redirect(homePathFor(data.user.id));
}

export async function signInWithOAuth(formData: FormData): Promise<void> {
  const provider = field(formData, 'provider');
  if (!isOAuthProvider(provider)) redirect(authErrorPath('oauth'));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl(
        getOrigin(),
        safeNextPath(field(formData, 'next'), ''),
        'oauth',
      ),
    },
  });
  if (error || !data.url) redirect(authErrorPath('oauth'));

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/');
}
