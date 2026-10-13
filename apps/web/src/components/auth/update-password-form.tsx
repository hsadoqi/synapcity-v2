'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { updatePassword, type AuthState } from '@/app/auth/actions';
import { AuthField } from './auth-field';
import { FormMessage } from './form-message';

const initialState: AuthState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <AuthField
        id="confirm"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage state={state} />
      <Button
        type="submit"
        size="lg"
        label="Update password"
        disabled={pending}
      >
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
