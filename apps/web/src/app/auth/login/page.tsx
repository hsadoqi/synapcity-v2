import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/components/login/login-form';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { safeNextPath } from '@/lib/routing/safe-next';
import { AuthLinkButton } from '@synapcity/features-auth/frontend';
import { AuthShell } from '@synapcity/features-auth/frontend';
import { AuthDivider } from '@synapcity/features-auth/frontend';

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
      <OAuthButtons next={next} />
      <AuthDivider label="or continue with email" />
      <LoginForm next={next} />
    </AuthShell>
  );
}
