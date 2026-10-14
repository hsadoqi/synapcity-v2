'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  authErrorFields,
  authErrorMessage,
  MIN_PASSWORD_LENGTH,
  type AuthFieldName,
} from '@/lib/auth/error-messages/error-messages';
import { homePathFor } from '@/lib/auth/home-path/home-path';
import { checkName } from '@/lib/auth/name/name';
import { authErrorPath, type AuthFlow } from '@/lib/auth/auth-flow/auth-flow';
import { getOrigin } from '@/lib/auth/origin/origin';
import { safeNextPath } from '@/lib/auth/safe-next/safe-next';
import { createClient } from '@/lib/supabase/server';

/**
 * `email` echoes the submitted address so a failed submit can refill the field:
 * React 19 resets a form after its action finishes. Passwords are never echoed.
 */
export type AuthState = {
  error?: string;
  /** The fields `error` is about; absent or empty when it concerns no one field. */
  fields?: AuthFieldName[];
  message?: string;
  success?: boolean;
  /** The address is valid but unconfirmed, so the form can offer a new link. */
  unconfirmed?: boolean;
  data?: {
    user?: UserData;
  };
};

type UserData = {
  email: string;
  /** Only collected when registering. */
  name?: string;
};

const OAUTH_PROVIDERS = ['google', 'github'] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

function callbackUrl(origin: string, next: string, flow: AuthFlow): string {
  const params = new URLSearchParams({ next, flow });
  return `${origin}/auth/callback?${params}`;
}

export async function signInWithPassword(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const password = field(formData, 'password');
  if (!email || !password) {
    return {
      error: 'Enter your email and password.',
      fields: [
        ...(email ? [] : (['email'] as const)),
        ...(password ? [] : (['password'] as const)),
      ],
      data: { user: { email } },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error)
    return {
      error: authErrorMessage(error.code),
      fields: authErrorFields(error.code),
      unconfirmed: error.code === 'email_not_confirmed',
      data: { user: { email } },
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
  if (!email)
    return {
      error: 'Enter your email.',
      fields: ['email'],
      data: { user: { email, name } },
    };
  if (nameError)
    return {
      error: nameError,
      fields: ['name'],
      data: { user: { email, name } },
    };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
      fields: ['password'],
      data: { user: { email, name } },
    };
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
    return {
      error: authErrorMessage(error.code),
      fields: authErrorFields(error.code),
      data: { user: { email, name } },
    };

  // A session exists only when the project does not require email
  // confirmation. ADR-0006 requires it, so this is the unusual branch.
  if (data.session && data.user) {
    revalidatePath('/', 'layout');
    redirect(next || homePathFor(data.user.id));
  }
  return {
    // Worded so it stays true when the address already has an account, in
    // which case Supabase sends nothing (it hides that to prevent account
    // discovery). Do not say a link "was sent".
    success: true,
    message:
      'Check your email for a link to confirm your account. If you already have an account, sign in or reset your password instead.',
    data: { user: { email, name } },
  };
}

export async function resendConfirmation(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const next = safeNextPath(field(formData, 'next'), '');
  if (!email)
    return {
      error: 'Enter your email.',
      fields: ['email'],
      data: { user: { email } },
    };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: callbackUrl(getOrigin(), next, 'confirm') },
  });
  if (
    error?.code === 'over_email_send_rate_limit' ||
    error?.code === 'over_request_rate_limit'
  ) {
    return { error: authErrorMessage(error.code), data: { user: { email } } };
  }

  // The same reply whether or not the address has a pending sign-up, like the
  // other forms, so this cannot be used to discover registered emails.
  return {
    success: true,
    message: 'Requested again. It can take a minute to arrive.',
    data: { user: { email } },
  };
}

export async function requestPasswordReset(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, 'email').trim();
  const name = '';
  if (!email)
    return {
      error: 'Enter your email.',
      fields: ['email'],
      data: { user: { email, name } },
    };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(getOrigin(), '/auth/update-password', 'reset'),
  });
  if (error?.code === 'over_email_send_rate_limit') {
    return {
      error: authErrorMessage(error.code),
      data: { user: { email, name } },
    };
  }

  // The same reply whether or not the address has an account, so the form
  // cannot be used to discover which emails are registered.
  return {
    success: true,
    message: 'If that email has an account, a reset link is on its way.',
    data: { user: { email, name } },
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
      fields: ['password'],
      data: { user: { email: '', name: '' } },
    };
  }
  if (password !== confirm)
    return {
      error: 'The passwords do not match.',
      fields: ['confirm'],
      data: { user: { email: '', name: '' } },
    };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error)
    return {
      error: authErrorMessage(error.code),
      fields: authErrorFields(error.code),
      data: { user: { email: '', name: '' } },
    };

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
