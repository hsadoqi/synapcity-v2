import type { Metadata } from 'next';
import { AuthLinkButton } from '@/components/auth/auth-link-button';

export const metadata: Metadata = { title: 'Sign-in problem' };

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col size-full items-center justify-center p-6 md:p-10">
      <div className="flex flex-col gap-1">
        <h1>That link did not work</h1>
        <p className="text-sm text-muted-foreground">
          It may have expired or already been used. Request a new one and try
          again.
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            If you continue to have issues, please contact support.
          </p>
          <p className="text-sm text-muted-foreground">
            You can also try signing in with a different method.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <AuthLinkButton type="login" label="Sign in" size="lg" />
        <AuthLinkButton
          type="forgot-password"
          label="Reset password"
          size="lg"
        />
      </div>
    </div>
  );
}
