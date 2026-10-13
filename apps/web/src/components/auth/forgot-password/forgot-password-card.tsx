'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { requestPasswordReset, type AuthState } from '@/app/auth/actions';
import { AuthLinkButton } from '../buttons/auth-link-button';
import { AuthConfirmation } from '../shell/auth-confirmation';
import { AuthShell } from '../shell/auth-shell';
import { ForgotPasswordForm } from './forgot-password-form';

const initialState: AuthState = {};

export function ForgotPasswordCard({ expired = false }: { expired?: boolean }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const email = state.data?.user?.email ?? '';

  return (
    <AuthShell
      title={state.success ? 'Check your email' : 'Reset your password'}
      description={
        state.success
          ? undefined
          : expired
            ? 'That reset link has expired or was already used. Enter your email for a new one.'
            : 'Enter your email and we’ll send you a link to choose a new password.'
      }
      footer={<AuthLinkButton type="login" />}
    >
      {state.success ? (
        <AuthConfirmation message={state.message} email={email}>
          <form action={formAction}>
            <input type="hidden" name="email" value={email} />
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Resending…' : 'Resend link'}
            </Button>
          </form>
        </AuthConfirmation>
      ) : (
        <ForgotPasswordForm
          state={state}
          formAction={formAction}
          pending={pending}
        />
      )}
    </AuthShell>
  );
}
