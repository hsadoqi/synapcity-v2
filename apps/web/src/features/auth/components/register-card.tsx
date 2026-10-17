'use client';

import { useActionState } from 'react';

import { signUp } from '@/features/auth/server/actions';
import type { AuthState } from '@/features/auth/shared/form-state';
import { AuthLinkButton } from '../shared/auth-link-button';
import { OAuthButtons } from '../shared/oauth-buttons';
import { AuthConfirmation } from '../shared/auth-confirmation';
import { AuthShell } from '../shared/auth-shell';
import { useConfirmation } from '@/features/auth/client/use-confirmation';
import { AuthDivider } from '../shared/auth-divider';
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
