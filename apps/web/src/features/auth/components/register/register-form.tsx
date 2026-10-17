'use client';

import { useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { MIN_PASSWORD_LENGTH, type AuthState } from '@/features/auth/types';
import { MAX_NAME_LENGTH } from '@/features/account/types';
import { FormField } from '@/components/forms/form-field';
import { useFocusFirstError } from '@/hooks/use-focus-first-error';
import { FormMessage } from '@/components/forms/form-message';
import { fieldErrorProps } from '@/components/forms/form-feedback';

export function RegisterForm({
  next,
  state,
  formAction,
  pending,
}: {
  next: string;
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
      <input type="hidden" name="next" value={next} />
      <FormField
        id="name"
        {...fieldErrorProps(state, 'name', messageId)}
        label="Name"
        hint={`Up to ${MAX_NAME_LENGTH} characters.`}
        type="text"
        autoComplete="name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={state.data?.user?.name}
        required
      />
      <FormField
        id="email"
        {...fieldErrorProps(state, 'email', messageId)}
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.data?.user?.email}
        required
      />
      <FormField
        id="password"
        {...fieldErrorProps(state, 'password', messageId)}
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <FormMessage id={messageId} state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
