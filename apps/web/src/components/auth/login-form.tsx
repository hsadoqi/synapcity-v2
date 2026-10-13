'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { signInWithPassword, type AuthState } from '@/app/auth/actions';
import { AuthField } from './auth-field';
import { FormMessage } from './form-message';

const initialState: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.email}
        required
      />
      <AuthField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="lg" label="Sign in" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
