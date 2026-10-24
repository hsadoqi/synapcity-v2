'use client';

import { useActionState, useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { updatePassword } from '@/features/auth/server/actions/actions';
import { type AuthState } from '@/features/auth/types';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
} from '@synapcity/domain-identity';
import {
  FormField,
  useFocusFirstError,
  FormMessage,
  fieldErrorProps,
} from '@synapcity/frontend-forms';

const initialState: AuthState = {};

export function UpdatePasswordForm({ next }: { next: string }) {
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
      <input type="hidden" name="next" value={next} />
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
