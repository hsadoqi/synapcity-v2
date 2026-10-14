'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { updatePassword } from '@/app/auth/actions';
import type { AuthState } from '@/lib/auth/auth-state/auth-state';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/error-messages/error-messages';
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
        hint={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <AuthField
        id="confirm"
        {...fieldErrorProps(state, 'confirm')}
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
