'use client';

import { useActionState } from 'react';

import { signUp } from '@/features/auth/server/actions/actions';
import type { AuthState } from '@synapcity/features-auth/contracts';
import { AuthLinkButton } from '@synapcity/features-auth/frontend';
import { OAuthButtons } from '../oauth-buttons';
import { AuthConfirmation } from '@synapcity/features-auth/frontend';
import { AuthShell } from '@synapcity/features-auth/frontend';
import { useConfirmation } from '@synapcity/features-auth/frontend';
import { AuthDivider } from '@synapcity/features-auth/frontend';
import { RegisterForm } from './register-form';
import { ResendConfirmation } from '../resend/resend-confirmation';

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
            email={state.data?.user?.email ?? ''}
            next={next}
          />
        </AuthConfirmation>
      ) : (
        <>
          <OAuthButtons next={next} />
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
