'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import type { AuthState } from '@/lib/auth/auth-state/auth-state';
import { AuthField } from '../form/auth-field';
import { useFocusFirstError } from '../form/use-focus-first-error';
import { fieldErrorProps, FormMessage } from '../form/form-message';

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

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="email"
        {...fieldErrorProps(state, 'email')}
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.data?.user?.email}
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
