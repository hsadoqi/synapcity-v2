'use client';

import { useActionState, useId } from 'react';

import { resendConfirmation } from '@/features/auth/server/actions/actions';
import type { AuthState } from '@/features/auth/types';
import { FormMessage } from '@/components/forms/form-message';
import { ResendButton } from '../../shared/resend-button';
import { useCooldown } from '@/features/auth/client';

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
}: {
  email: string;
  next: string;
  label?: string;
  waitFirst?: boolean;
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
