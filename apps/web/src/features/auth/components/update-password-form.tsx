'use client';

import { useActionState, useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { updatePassword } from '@/features/auth/server/actions';
import type { AuthState } from '@/features/auth/shared/form-state';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/shared/error-messages';
import { AuthField } from '@/components/forms/form-field';
import { useFocusFirstError } from '@/components/forms/use-focus-first-error';
import { FormMessage } from '@/components/forms/form-message';
import { fieldErrorProps } from '@/features/auth/shared/form-feedback';

const initialState: AuthState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  const formRef = useFocusFirstError(state);
  const messageId = useId();

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="password"
        {...fieldErrorProps(state, 'password', messageId)}
        label="New password"
        type="password"
        autoComplete="new-password"
        hint={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <AuthField
        id="confirm"
        {...fieldErrorProps(state, 'confirm', messageId)}
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <FormMessage id={messageId} state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
