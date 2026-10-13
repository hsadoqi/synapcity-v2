'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { requestPasswordReset, type AuthState } from '@/app/auth/actions';
import { AuthField } from './auth-field';
import { FormMessage } from './form-message';

const initialState: AuthState = {};

export function ForgotPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.email}
        required
      />
      <FormMessage state={state} />
      <Button
        type="submit"
        size="lg"
        label="Send reset link"
        disabled={pending}
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
