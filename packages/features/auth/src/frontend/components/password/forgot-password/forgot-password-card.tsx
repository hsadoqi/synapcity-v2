'use client';

import { useActionState } from 'react';
import type { AuthState, AuthAction } from '../../../../contracts';
import { AuthLinkButton } from '../../../auth-link-button';
import { AuthConfirmation } from '../../../auth-confirmation';
import { AuthShell } from '../../../auth-shell';
import { useConfirmation } from '../../../client/use-confirmation';
import { ForgotPasswordForm } from './forgot-password-form';
import { ResendResetLink } from '../../resend';

const initialState: AuthState = {};

export function ForgotPasswordCard({
  expired = false,
  requestPasswordReset,
}: {
  expired?: boolean;
  requestPasswordReset: AuthAction;
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const email = state.data?.user?.email ?? '';
  const { confirmed, edit, formState } = useConfirmation(state);

  return (
    <AuthShell
      title={confirmed ? 'Check your email' : 'Reset your password'}
      description={
        confirmed
          ? undefined
          : expired
            ? 'That reset link has expired or was already used. Enter your email for a new one.'
            : 'Enter your email and we’ll send you a link to choose a new password.'
      }
      footer={<AuthLinkButton type="login" />}
    >
      {confirmed ? (
        <AuthConfirmation message={state.message} email={email} onEdit={edit}>
          <ResendResetLink
            requestPasswordReset={requestPasswordReset}
            email={email}
          />
        </AuthConfirmation>
      ) : (
        <ForgotPasswordForm
          state={formState}
          formAction={formAction}
          pending={pending}
        />
      )}
    </AuthShell>
  );
}
