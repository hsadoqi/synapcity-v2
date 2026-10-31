'use client';

import { useActionState, useId } from 'react';

import type { AuthState, AuthAction } from '../../../contracts';
import { FormMessage } from '@synapcity/frontend-forms';
import { useCooldown } from '../../hooks/use-cooldown';
import { ResendButton } from '../resend-button';

const initialState: AuthState = {};

/**
 * A second chance at the confirmation email. Shown from the screen that
 * promised it, where the first email was just sent (`waitFirst`), and from a
 * sign-in that was refused for an unconfirmed address, where none was.
 */
export function ResendConfirmation({
  email,
  next,
  label = 'Resend link',
  waitFirst = true,
  resendConfirmation,
}: {
  email: string;
  next: string;
  label?: string;
  waitFirst?: boolean;
  resendConfirmation: AuthAction;
}) {
  const [state, formAction, pending] = useActionState(
    resendConfirmation,
    initialState,
  );
  const wait = useCooldown(state, waitFirst);
  const messageId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <FormMessage id={messageId} state={state} />
      <ResendButton
        label={label}
        pending={pending}
        wait={wait}
        hintId="resend-confirmation-hint"
      />
    </form>
  );
}
