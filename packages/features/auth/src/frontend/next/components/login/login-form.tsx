'use client';

import { useActionState, useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

import type { AuthState, AuthAction } from '../../../../contracts';
import {
  FormField,
  useFocusFirstError,
  FormMessage,
  fieldErrorProps,
} from '@synapcity/frontend-forms';
import { ResendConfirmation } from '../../../components/resend';

const initialState: AuthState = {};

export function LoginForm({
  next,
  signInWithPassword,
  resendConfirmation,
}: {
  next: string;
  signInWithPassword: AuthAction;
  resendConfirmation: AuthAction;
}) {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState,
  );

  const formRef = useFocusFirstError(state);
  const messageId = useId();

  const email = state.data?.user?.email ?? '';

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="next" value={next} />
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
          autoComplete="current-password"
          labelAction={
            <LinkButton
              href="/auth/forgot-password"
              variant="link"
              size="sm"
              className="-my-1 h-auto min-h-6 px-0 pointer-coarse:my-0"
            >
              Forgot password?
            </LinkButton>
          }
          required
        />
        <FormMessage id={messageId} state={state} />
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      {state.unconfirmed && email ? (
        <ResendConfirmation
          resendConfirmation={resendConfirmation}
          email={email}
          next={next}
          label="Resend confirmation email"
          waitFirst={false}
        />
      ) : null}
    </>
  );
}
