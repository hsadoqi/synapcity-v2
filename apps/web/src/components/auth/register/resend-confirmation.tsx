'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { resendConfirmation, type AuthState } from '@/app/auth/actions';
import { FormMessage } from '../form/form-message';

const initialState: AuthState = {};

/** A second chance at the confirmation email, from the screen that promised it. */
export function ResendConfirmation({
  email,
  next,
}: {
  email: string;
  next: string;
}) {
  const [state, formAction, pending] = useActionState(
    resendConfirmation,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? 'Resending…' : 'Resend link'}
      </Button>
    </form>
  );
}
