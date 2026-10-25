'use client';

import { useActionState, useId } from 'react';

import { requestOwnPasswordReset } from '@/features/auth/server/actions/actions';
import { useCooldown } from '@synapcity/features-auth/frontend';
import type { AuthState } from '@synapcity/features-auth/contracts';
import { FormMessage } from '@synapcity/frontend-forms';
import { ResendButton } from '@synapcity/features-auth/frontend';
import { SignInAgain } from '../../sign-in-again';

const initialState: AuthState = {};

/**
 * Resetting the password from settings. It sends a link to the person's own
 * address and goes no further: the new password is chosen on the reset page the
 * link opens, so no password is typed or handled here. The address is the
 * server's, not this form's (it sends none).
 */
export function PasswordReset() {
  const [state, formAction, pending] = useActionState(
    requestOwnPasswordReset,
    initialState,
  );
  // Free to use at first; a request that went out starts the wait.
  const wait = useCooldown(state, false);
  const messageId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Password</span>
        <span className="text-sm text-muted-foreground">
          We email you a link to choose a new one. Your password does not change
          until you do.
        </span>
      </div>
      {state.success ? (
        <p role="status" className="text-sm font-medium">
          {state.message} If nothing arrives, check your spam folder.
        </p>
      ) : null}
      <FormMessage id={messageId} state={{ error: state.error }} />
      {state.signedOut ? <SignInAgain /> : null}
      <ResendButton
        label={state.success ? 'Send again' : 'Send reset link'}
        pending={pending}
        wait={wait}
        hintId="password-reset-hint"
      />
    </form>
  );
}
