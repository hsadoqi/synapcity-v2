'use client';

import { useActionState } from 'react';

import type { AuthState, AuthAction, AuthFormAction } from '../../../contracts';
import { AuthLinkButton } from '../../next/components/auth-link-button';
import { OAuthButtons } from '../oauth-buttons';
import { useConfirmation } from '../../hooks/use-confirmation';
import { AuthConfirmation } from '../auth-confirmation';
import { AuthDivider } from '../auth-divider';
import { AuthShell } from '../auth-shell';
import { RegisterForm } from './register-form';
import { ResendConfirmation } from '../resend';

const initialState: AuthState = {};

export function RegisterCard({
  next,
  signUp,
  resendConfirmation,
  signInWithOAuth,
}: {
  next: string;
  signUp: AuthAction;
  resendConfirmation: AuthAction;
  signInWithOAuth: AuthFormAction;
}) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const { confirmed, edit, formState } = useConfirmation(state);

  return (
    <AuthShell
      title={confirmed ? 'Check your email' : 'Sign up'}
      description={
        confirmed
          ? undefined
          : 'Create your account with an email and password, or use Google or GitHub.'
      }
      footer={
        <AuthLinkButton
          type="login"
          label="Already have an account? Sign in"
          next={next}
        />
      }
    >
      {confirmed ? (
        <AuthConfirmation
          message={state.message}
          email={state.data?.user?.email ?? ''}
          onEdit={edit}
        >
          <ResendConfirmation
            resendConfirmation={resendConfirmation}
            email={state.data?.user?.email ?? ''}
            next={next}
          />
        </AuthConfirmation>
      ) : (
        <>
          <OAuthButtons signInWithOAuth={signInWithOAuth} next={next} />
          <AuthDivider label="or continue with email" />
          <RegisterForm
            next={next}
            state={formState}
            formAction={formAction}
            pending={pending}
          />
        </>
      )}
    </AuthShell>
  );
}
