'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { authErrorPath, callbackUrl } from '@/lib/routing/auth-flow';
import {
  ALREADY_YOUR_EMAIL,
  authFailure,
  authSuccess,
  emailRequestSchema,
  everyRefusal,
  firstRefusal,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  type AuthState,
} from '@/features/auth/types';
import {
  authErrorFields,
  authErrorMessage,
  emailChangeErrorFields,
  emailChangeErrorMessage,
  isRateLimited,
  linkErrorMessage,
} from '@/features/auth/shared/error-messages';
import { isOAuthProvider } from '@/features/auth/shared/oauth-providers';
import { field } from '@/features/auth/server/form-data';
import { homePathFor, settingsPathFor } from '@/lib/routing/user-paths';
import { withNotice } from '@/lib/routing/notices';
import { getOrigin } from '@/features/auth/server/site-origin';
import { safeNextPath } from '@/lib/routing/safe-next';
import { createClient } from '@/lib/supabase/server';

import { getCurrentUser } from '../session';
import {
  changeEmail,
  registerWithPassword,
  requestRecoveryEmail,
  resendEmailChange as resendEmailChangeOperation,
  sendOwnPasswordReset,
  startAccountLink,
} from '../operations';

export async function signInWithPassword(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: field(formData, 'email'),
    password: field(formData, 'password'),
  });
  if (!parsed.success) {
    // Either field may be the empty one, so every empty one is marked.
    const { message, fields } = everyRefusal(parsed.error);
    return authFailure(
      message,
      { email: field(formData, 'email').trim() },
      fields,
    );
  }
  const { email, password } = parsed.data;

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
  // Empty when the visitor gave no destination: the callback then falls back
  // to the new user's own home.
  const next = safeNextPath(field(formData, 'next'), '');
  const parsed = signUpSchema.safeParse({
    email: field(formData, 'email'),
    name: field(formData, 'name'),
    password: field(formData, 'password'),
  });
  if (!parsed.success) {
    const { message, fields } = firstRefusal(parsed.error);
    return authFailure(
      message,
      {
        email: field(formData, 'email').trim(),
        name: field(formData, 'name').trim(),
      },
      fields,
    );
  }
  const { email, name, password } = parsed.data;
  const user = { email, name };

  const outcome = await registerWithPassword({
    email,
    password,
    name,
    confirmationRedirect: callbackUrl(getOrigin(), next, 'confirm'),
  });
  if (outcome.kind === 'provider-error') {
    return authFailure(
      authErrorMessage(outcome.code),
      user,
      authErrorFields(outcome.code),
    );
  }

  // A session exists only when the project does not require email
  // confirmation. ADR-0006 requires it, so this is the unusual branch.
  if (outcome.kind === 'signed-in') {
    revalidatePath('/', 'layout');
    redirect(next || homePathFor(outcome.userId));
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
  const next = safeNextPath(field(formData, 'next'), '');
  const parsed = emailRequestSchema.safeParse({
    email: field(formData, 'email'),
  });
  if (!parsed.success) {
    const { message, fields } = firstRefusal(parsed.error);
    return authFailure(
      message,
      { email: field(formData, 'email').trim() },
      fields,
    );
  }
  const { email } = parsed.data;

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
  const parsed = emailRequestSchema.safeParse({
    email: field(formData, 'email'),
  });
  if (!parsed.success) {
    const { message, fields } = firstRefusal(parsed.error);
    return authFailure(
      message,
      { email: field(formData, 'email').trim(), name: '' },
      fields,
    );
  }
  const { email } = parsed.data;
  const user = { email, name: '' };

  const outcome = await requestRecoveryEmail({
    email,
    resetRedirect: callbackUrl(getOrigin(), '/auth/update-password', 'reset'),
  });
  // Both limits, as in `resendConfirmation`. Only the email one used to be
  // handled, so a request-rate limit was reported as "a reset link is on its
  // way". Changed with the repository owner's approval; it departs from
  // "preserve recovery's failure policy" in ADR-0008 and the refactor plan.
  if (outcome.kind === 'rate-limited') {
    return authFailure(authErrorMessage(outcome.code), user);
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
  const user = { email: '', name: '' };
  // Where a reset started from settings goes back to. Untrusted, so checked.
  const next = safeNextPath(field(formData, 'next'), '');
  const parsed = updatePasswordSchema.safeParse({
    password: field(formData, 'password'),
    confirm: field(formData, 'confirm'),
  });
  if (!parsed.success) {
    const { message, fields } = firstRefusal(parsed.error);
    return authFailure(message, user, fields);
  }
  const { password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Log the code (never the message or the password) so a failure that shows
    // the generic reply can be traced in the server logs.
    console.warn('updatePassword failed', {
      code: error.code,
      status: error.status,
    });
    return authFailure(
      authErrorMessage(error.code),
      user,
      authErrorFields(error.code),
    );
  }

  revalidatePath('/', 'layout');
  // The page they land on shows this once (see NoticeToast).
  redirect(withNotice(next || homePathFor(data.user.id), 'password-updated'));
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
  // Redirect either way: the person asked to leave and has no recovery step to
  // take. Log only the operation and the code, never the error object, so a
  // failure can be traced without a session, token or email reaching the logs.
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('signOut failed', {
        code: error.code,
        status: error.status,
      });
    }
  } catch {
    console.warn('signOut failed', { thrown: true });
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

const SIGNED_OUT = authErrorMessage('session_not_found');

/** The session has gone: say so, and flag it so the form can link to sign-in. */
function signedOutFailure(email: string): AuthState {
  return { ...authFailure(SIGNED_OUT, { email }), signedOut: true };
}
const TRY_AGAIN = authErrorMessage(undefined);

/** Where the confirmation link brings someone back to: their settings. */
async function emailChangeRedirect(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return callbackUrl(getOrigin(), settingsPathFor(user.id), 'email-change');
}

/**
 * Asks to change the signed-in person's email. Nothing changes now: the
 * provider sends a confirmation link and the address changes only when it is
 * used. The waiting state is read back from the provider, not remembered here.
 */
export async function requestEmailChange(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const typed = field(formData, 'email').trim();
  const parsed = emailRequestSchema.safeParse({ email: typed });
  if (!parsed.success) {
    const { message, fields } = firstRefusal(parsed.error);
    return authFailure(message, { email: typed }, fields);
  }
  const { email } = parsed.data;

  const redirectTo = await emailChangeRedirect();
  if (!redirectTo) return signedOutFailure(email);

  const outcome = await changeEmail({ newEmail: email, redirectTo });
  switch (outcome.kind) {
    case 'signed-out':
      return signedOutFailure(email);
    case 'unavailable':
      return authFailure(TRY_AGAIN, { email });
    case 'same-email':
      return authFailure(ALREADY_YOUR_EMAIL, { email }, ['email']);
    case 'provider-error':
      // The code only, never the message, which can hold the address.
      console.warn('requestEmailChange failed', { code: outcome.code });
      return authFailure(
        emailChangeErrorMessage(outcome.code),
        { email },
        emailChangeErrorFields(outcome.code),
      );
    case 'changed':
      revalidatePath('/', 'layout');
      return authSuccess('Email address updated.', { email });
    case 'requested':
      revalidatePath('/', 'layout');
      return authSuccess(
        `We sent a confirmation link to ${email}. Your email stays the same until you use it. You may get one at your current address too; if so, confirm that one as well.`,
        { email },
      );
  }
}

/** Sends the confirmation for a pending email change again. */
export async function resendEmailChange(
  _previous: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  const redirectTo = await emailChangeRedirect();
  if (!redirectTo) return signedOutFailure('');

  const outcome = await resendEmailChangeOperation({ redirectTo });
  switch (outcome.kind) {
    case 'signed-out':
      return signedOutFailure('');
    case 'unavailable':
      return authFailure(TRY_AGAIN, { email: '' });
    case 'nothing-pending':
      revalidatePath('/', 'layout');
      return authFailure('There is no email change waiting to be confirmed.', {
        email: '',
      });
    case 'provider-error':
      console.warn('resendEmailChange failed', { code: outcome.code });
      return authFailure(authErrorMessage(outcome.code), { email: '' });
    case 'sent':
      return authSuccess('Requested again. It can take a minute to arrive.', {
        email: outcome.email,
      });
  }
}

/**
 * Sends the signed-in person a link to choose a new password. It takes no
 * input: the address is their own, read from the provider, and the link goes
 * through the same reset flow as the public form.
 */
export async function requestOwnPasswordReset(
  _previous: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return signedOutFailure('');

  // Where to come back to once the new password is chosen: here, not home.
  const back = `/auth/update-password?${new URLSearchParams({ next: settingsPathFor(user.id) })}`;
  const outcome = await sendOwnPasswordReset({
    resetRedirect: callbackUrl(getOrigin(), back, 'reset'),
  });

  switch (outcome.kind) {
    case 'signed-out':
      return signedOutFailure('');
    case 'unavailable':
      return authFailure(TRY_AGAIN, { email: '' });
    case 'no-email':
      return authFailure(
        'This account has no email address to send a link to.',
        { email: '' },
      );
    case 'rate-limited':
      return authFailure(authErrorMessage(outcome.code), { email: '' });
    case 'provider-error':
      console.warn('requestOwnPasswordReset failed', { code: outcome.code });
      return authFailure(authErrorMessage(outcome.code), { email: '' });
    case 'sent':
      return authSuccess(
        `We sent a link to ${outcome.email}. Open it to choose a new password.`,
        { email: outcome.email },
      );
  }
}

/**
 * Starts connecting a Google or GitHub account to the signed-in person's
 * account. On success it does not return: it sends the browser to the
 * provider, which brings the person back through the callback to settings.
 */
export async function connectAccount(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const provider = field(formData, 'provider');
  if (!isOAuthProvider(provider)) return authFailure(TRY_AGAIN, { email: '' });

  const user = await getCurrentUser();
  if (!user) return signedOutFailure('');

  const outcome = await startAccountLink({
    provider,
    redirectTo: callbackUrl(getOrigin(), settingsPathFor(user.id), 'link'),
  });

  switch (outcome.kind) {
    case 'redirect':
      redirect(outcome.url);
    case 'signed-out':
      return signedOutFailure('');
    case 'unavailable':
      return authFailure(TRY_AGAIN, { email: '' });
    case 'provider-error':
      console.warn('connectAccount failed', {
        provider,
        code: outcome.code,
      });
      return authFailure(linkErrorMessage(outcome.code), { email: '' });
  }
}
