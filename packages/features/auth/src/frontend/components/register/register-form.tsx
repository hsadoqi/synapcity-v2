'use client';

import { useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  registrationSchema,
} from '@synapcity/domain-identity';
import { PersonNameInputs } from '@synapcity/features-account/frontend';
import type { AuthState } from '../../../contracts';
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
  // the one the server would give, for the same first field. The fields are in
  // the order the schema reports them.
  const {
    formProps,
    register,
    state: shown,
  } = useActionForm({ schema: registrationSchema, action: formAction, state });
  const formRef = useFocusFirstError(shown);
  const messageId = useId();
  const user = state.data?.user;

  return (
    <form ref={formRef} {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <PersonNameInputs
        state={shown}
        messageId={messageId}
        defaultFirstName={user?.firstName ?? ''}
        defaultLastName={user?.lastName ?? ''}
        firstNameProps={register('firstName')}
        lastNameProps={register('lastName')}
      />
      <FormField
        id="email"
        {...fieldErrorProps(shown, 'email', messageId)}
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={user?.email}
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
      <FormField
        id="confirm"
        {...fieldErrorProps(shown, 'confirm', messageId)}
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
        {...register('confirm')}
      />
      <FormMessage id={messageId} state={shown} />
      {/* Stays in the tab order while pending, announced as unavailable. */}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        focusableWhenDisabled
        aria-busy={pending}
      >
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
