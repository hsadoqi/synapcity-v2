'use client';

import { useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { emailRequestSchema } from '@synapcity/domain-identity';

import type { AuthState } from '@/features/auth/types';
import {
  FormField,
  useActionForm,
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
  // The same schema the server action uses, so a refusal in the browser reads
  // exactly like the server's. The form keeps its action and works before the
  // page hydrates; once it has, an empty email is refused without a round trip.
  const {
    formProps,
    register,
    state: shown,
  } = useActionForm({
    schema: emailRequestSchema,
    action: formAction,
    state,
  });
  const formRef = useFocusFirstError(shown);
  const messageId = useId();

  return (
    <form ref={formRef} {...formProps} className="flex flex-col gap-4">
      <FormField
        id="email"
        {...fieldErrorProps(shown, 'email', messageId)}
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.data?.user?.email}
        required
        {...register('email')}
      />
      <FormMessage id={messageId} state={shown} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
