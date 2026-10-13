'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import type { AuthState } from '@/app/auth/actions';
import { MAX_NAME_LENGTH } from '@/lib/auth/name/name';
import { AuthField } from '../form/auth-field';
import { useFocusFirstError } from '../form/use-focus-first-error';
import { fieldErrorProps, FormMessage } from '../form/form-message';

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

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="name"
        {...fieldErrorProps(state, 'name')}
        label="Name"
        type="text"
        autoComplete="name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={state.data?.user?.name}
        required
      />
      <AuthField
        id="email"
        {...fieldErrorProps(state, 'email')}
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.data?.user?.email}
        required
      />
      <AuthField
        id="password"
        {...fieldErrorProps(state, 'password')}
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="Use at least 8 characters."
        minLength={8}
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
