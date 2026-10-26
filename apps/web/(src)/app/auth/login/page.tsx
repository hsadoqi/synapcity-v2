import type { Metadata } from 'next';

import {
  resendConfirmation,
  signInWithOAuth,
  signInWithPassword,
} from '../../../../src/features/auth/server/actions/actions';
import { safeNextPath } from '../../../../src/lib/routing/safe-next';
import {
  AuthDivider,
  AuthLinkButton,
  AuthShell,
  LoginForm,
  OAuthButtons,
} from '@synapcity/features-auth/frontend';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Empty when absent: the server action then picks the user's own home.
  const next = safeNextPath((await searchParams).next, '');

  return (
    <AuthShell
      title="Sign in"
      footer={
        <AuthLinkButton
          type="register"
          label="Don’t have an account? Sign up"
          next={next}
        />
      }
    >
      <OAuthButtons next={next} signInWithOAuth={signInWithOAuth} />
      <AuthDivider label="or continue with email" />
      <LoginForm
        next={next}
        signInWithPassword={signInWithPassword}
        resendConfirmation={resendConfirmation}
      />
    </AuthShell>
  );
}
