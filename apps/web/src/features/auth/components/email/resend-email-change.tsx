'use client';

import { useActionState, useId } from 'react';

import { resendEmailChange } from '@/features/auth/server/actions/actions';
import type { AuthState } from '@synapcity/features-auth/contracts';
import { FormMessage } from '@synapcity/frontend-forms';
import { useCooldown } from '@/features/auth/client';
import { ResendButton } from '@synapcity/features-auth/frontend';
import { SignInAgain } from '../sign-in-again';

const initialState: AuthState = {};

/**
 * A second chance at the confirmation email for the change that is waiting.
 * It sends no address: the server resends to the one it holds as pending.
 * `justRequested` starts the wait at once, because the first email has only
 * just gone out.
 */
export function ResendEmailChange({
  justRequested,
}: {
  justRequested: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    resendEmailChange,
    initialState,
  );
  const wait = useCooldown(state, justRequested);
  const messageId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <FormMessage id={messageId} state={state} />
      {state.signedOut ? <SignInAgain /> : null}
      <ResendButton
        label="Resend link"
        pending={pending}
        wait={wait}
        hintId="resend-email-change-hint"
      />
    </form>
  );
}
