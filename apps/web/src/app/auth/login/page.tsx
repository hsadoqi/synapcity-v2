import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/components/login-form';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { safeNextPath } from '@/lib/routing/safe-next';
import { AuthLinkButton } from '@/features/auth/shared/auth-link-button';
import { AuthShell } from '@/features/auth/shared/auth-shell';
import { AuthDivider } from '@/features/auth/shared/auth-divider';

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
