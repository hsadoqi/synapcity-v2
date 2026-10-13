'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { signUp, type AuthState } from '@/app/auth/actions';
import { AuthField } from './auth-field';
import { FormMessage } from './form-message';

const initialState: AuthState = {};

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);

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
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="lg" label="Create account" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
