'use client';

import { useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import type { AuthState } from '@/features/auth/shared/form-state';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/shared/error-messages';
import { MAX_NAME_LENGTH } from '@/features/account/shared/name';
import { AuthField } from '@/components/forms/form-field';
import { useFocusFirstError } from '@/components/forms/use-focus-first-error';
import { FormMessage } from '@/components/forms/form-message';
import { fieldErrorProps } from '@/features/auth/shared/form-feedback';

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
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="name"
        {...fieldErrorProps(state, 'name', messageId)}
        label="Name"
        type="text"
        autoComplete="name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={state.data?.user?.name}
        required
      />
      <AuthField
        id="email"
        {...fieldErrorProps(state, 'email', messageId)}
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.data?.user?.email}
        required
      />
      <AuthField
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
