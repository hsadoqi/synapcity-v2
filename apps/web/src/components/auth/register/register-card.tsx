'use client';

import { useActionState } from 'react';

import { signUp, type AuthState } from '@/app/auth/actions';
import { AuthLinkButton } from '../buttons/auth-link-button';
import { OAuthButtons } from '../buttons/oauth-buttons';
import { AuthConfirmation } from '../shell/auth-confirmation';
import { AuthShell } from '../shell/auth-shell';
import { RegisterForm } from './register-form';
import { ResendConfirmation } from './resend-confirmation';

const initialState: AuthState = {};

export function RegisterCard({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <AuthShell
      title={state.success ? 'Check your email' : 'Sign up'}
      description={
        state.success
          ? undefined
          : 'Use your email and a password, or continue with a provider.'
      }
      footer={
        <AuthLinkButton
          type="login"
          label="Already have an account? Sign in"
          next={next}
        />
      }
    >
      {state.success ? (
        <AuthConfirmation
          message={state.message}
          email={state.data?.user?.email ?? ''}
        >
          <ResendConfirmation
            email={state.data?.user?.email ?? ''}
            next={next}
          />
        </AuthConfirmation>
      ) : (
        <>
          <OAuthButtons next={next} />
          <p className="text-center text-xs text-muted-foreground">or</p>
          <RegisterForm
            next={next}
            state={state}
            formAction={formAction}
            pending={pending}
          />
        </>
      )}
    </AuthShell>
  );
}
