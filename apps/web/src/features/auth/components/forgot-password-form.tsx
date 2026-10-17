'use client';

import { useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import type { AuthState } from '@/features/auth/shared/form-state';
import { AuthField } from '@/features/auth/shared/auth-field';
import { useFocusFirstError } from '@/hooks/use-focus-first-error';
import { FormMessage } from '@/components/forms/form-message';
import { fieldErrorProps } from '@/features/auth/shared/form-feedback';

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
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <AuthField
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
