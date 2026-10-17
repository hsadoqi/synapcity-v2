'use client';

import { useActionState, useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { updatePassword } from '@/features/auth/server/actions/actions';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  type AuthState,
} from '@/features/auth/types';
import { FormField } from '@/components/forms/form-field';
import { useFocusFirstError } from '@/hooks/use-focus-first-error';
import { FormMessage } from '@/components/forms/form-message';
import { fieldErrorProps } from '@/components/forms/form-feedback';

const initialState: AuthState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  const formRef = useFocusFirstError(state);
  const messageId = useId();

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        id="password"
        {...fieldErrorProps(state, 'password', messageId)}
        label="New password"
        type="password"
        autoComplete="new-password"
        hint={PASSWORD_REQUIREMENTS}
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <FormField
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
