'use client';

import { useActionState, useId } from 'react';

import { requestPasswordReset } from '@/features/auth/server/actions';
import type { AuthState } from '@/features/auth/types';
import { FormMessage } from '@/components/forms/form-message';
import { ResendButton } from '../../shared/resend-button';
import { useCooldown } from '@/features/auth/client/use-cooldown';

const initialState: AuthState = {};

/**
 * A second chance at the reset email, from the screen that promised it.
 * The action's reply is identical to the first one so it cannot reveal
 * accounts, which also means it would change nothing on screen. This says
 * that a second request went out, in the same words the sign-up resend uses.
 */
export function ResendResetLink({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const wait = useCooldown(state);
  const messageId = useId();
  const shown: AuthState = state.success
    ? { message: 'Requested again. It can take a minute to arrive.' }
    : state;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      <FormMessage id={messageId} state={shown} />
      <ResendButton
        label="Resend link"
        pending={pending}
        wait={wait}
        hintId="resend-reset-hint"
      />
    </form>
  );
}
