import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login/login-form';
import { OAuthButtons } from '@/components/auth/buttons/oauth-buttons';
import { safeNextPath } from '@/lib/auth/safe-next/safe-next';
import { AuthLinkButton } from '@/components/auth/buttons/auth-link-button';
import { AuthShell } from '@/components/auth/shell/auth-shell';

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
      <p className="text-center text-xs text-muted-foreground">or</p>
      <LoginForm next={next} />
    </AuthShell>
  );
}
