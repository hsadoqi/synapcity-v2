'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { updatePassword, type AuthState } from '@/app/auth/actions';
import { AuthField } from '../form/auth-field';
import { useFocusFirstError } from '../form/use-focus-first-error';
import { fieldErrorProps, FormMessage } from '../form/form-message';

const initialState: AuthState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  const formRef = useFocusFirstError(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="password"
        {...fieldErrorProps(state, 'password')}
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="Use at least 8 characters."
        minLength={8}
        required
      />
      <AuthField
        id="confirm"
        {...fieldErrorProps(state, 'confirm')}
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
