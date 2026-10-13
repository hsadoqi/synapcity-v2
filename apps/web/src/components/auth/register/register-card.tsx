'use client';

import { useActionState } from 'react';

import { signUp, type AuthState } from '@/app/auth/actions';
import { AuthLinkButton } from '../buttons/auth-link-button';
import { OAuthButtons } from '../buttons/oauth-buttons';
import { AuthConfirmation } from '../shell/auth-confirmation';
import { AuthShell } from '../shell/auth-shell';
import { useConfirmation } from '../form/use-confirmation';
import { RegisterForm } from './register-form';
import { ResendConfirmation } from './resend-confirmation';

const initialState: AuthState = {};

export function RegisterCard({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const { confirmed, edit, formState } = useConfirmation(state);

  return (
    <AuthShell
      title={confirmed ? 'Check your email' : 'Sign up'}
      description={
        confirmed
          ? undefined
          : 'Use your email and a password, or continue with Google or GitHub.'
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
            state={formState}
            formAction={formAction}
            pending={pending}
          />
        </>
      )}
    </AuthShell>
  );
}
