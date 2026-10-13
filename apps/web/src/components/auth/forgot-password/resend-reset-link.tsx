'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { requestPasswordReset, type AuthState } from '@/app/auth/actions';
import { FormMessage } from '../form/form-message';
import { useCooldown } from '../form/use-cooldown';

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
  const shown: AuthState = state.success
    ? { message: 'Requested again. It can take a minute to arrive.' }
    : state;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      <FormMessage state={shown} />
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={pending || wait > 0}
        aria-busy={pending}
      >
        {pending
          ? 'Resending…'
          : wait > 0
            ? `Resend in ${wait}s`
            : 'Resend link'}
      </Button>
    </form>
  );
}
