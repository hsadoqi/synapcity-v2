'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';

import { signInWithPassword, type AuthState } from '@/app/auth/actions';
import { AuthField } from '../form/auth-field';
import { useFocusFirstError } from '../form/use-focus-first-error';
import { fieldErrorProps, FormMessage } from '../form/form-message';

const initialState: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState,
  );

  const formRef = useFocusFirstError(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
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
        autoComplete="current-password"
        labelAction={
          <LinkButton
            href="/auth/forgot-password"
            variant="link"
            size="sm"
            className="-my-1 h-auto px-0 pointer-coarse:my-0"
          >
            Forgot password?
          </LinkButton>
        }
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
