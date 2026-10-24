'use client';

import { useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  signUpSchema,
  type AuthState,
} from '@/features/auth/types';
import { MAX_NAME_LENGTH } from '@/features/account/types';
import {
  FormField,
  useActionForm,
  useFocusFirstError,
  FormMessage,
  fieldErrorProps,
} from '@synapcity/frontend-forms';

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
  // The schema the sign-up action parses with, so a refusal in the browser is
  // the one the server would give, for the same first field.
  const {
    formProps,
    register,
    state: shown,
  } = useActionForm({ schema: signUpSchema, action: formAction, state });
  const formRef = useFocusFirstError(shown);
  const messageId = useId();

  return (
    <form ref={formRef} {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <FormField
        id="name"
        {...fieldErrorProps(shown, 'name', messageId)}
        label="Name"
        hint={`Up to ${MAX_NAME_LENGTH} characters.`}
        type="text"
        autoComplete="name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={state.data?.user?.name}
        required
        {...register('name')}
      />
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
      <FormField
        id="password"
        {...fieldErrorProps(shown, 'password', messageId)}
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={PASSWORD_REQUIREMENTS}
        minLength={MIN_PASSWORD_LENGTH}
        required
        {...register('password')}
      />
      <FormMessage id={messageId} state={shown} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
