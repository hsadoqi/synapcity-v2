'use client';

import { useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import type { AuthState } from '@/features/auth/types';
import {
  FormField,
  useFocusFirstError,
  FormMessage,
  fieldErrorProps,
} from '@synapcity/frontend-forms';

export function ForgotPasswordForm({
  state,
  formAction,
  pending,
}: {
  state: AuthState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
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
        id="email"
        {...fieldErrorProps(state, 'email', messageId)}
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.data?.user?.email}
        required
      />
      <FormMessage id={messageId} state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
