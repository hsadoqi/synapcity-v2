import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { safeNextPath } from '@/lib/auth/safe-next';
import { AuthLinkButton } from '@/components/auth/auth-link-button';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1>Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use your email and password, or continue with a provider.
        </p>
      </header>
      <OAuthButtons next={next} />
      <p className="text-center text-xs text-muted-foreground">or</p>
      <LoginForm next={next} />
      <nav className="flex justify-between">
        <AuthLinkButton
          type="forgot-password"
          label="Forgot password?"
          className="mr-auto"
        />
        <AuthLinkButton
          type="register"
          label="Create an account"
          className="ml-auto"
        />
      </nav>
    </>
  );
}
