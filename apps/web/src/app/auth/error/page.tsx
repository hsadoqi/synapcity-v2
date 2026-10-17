import type { Metadata } from 'next';

import { AuthLinkButton } from '@/features/auth/shared';
import { AuthShell } from '@/features/auth/shared';
import { parseAuthFlow, type AuthFlow } from '@/lib/routing/auth-flow';

export const metadata: Metadata = { title: 'Sign-in problem' };

type Destination = 'login' | 'register' | 'forgot-password';

type Recovery = {
  title: string;
  description: string;
  primary: { type: Destination; label: string };
  secondary?: { type: Destination; label: string };
};

// Each failure gets the recovery that fits what the person was doing.
const RECOVERY: Record<AuthFlow | 'unknown', Recovery> = {
  oauth: {
    title: 'Signing in with that provider did not finish',
    description:
      'It may have been cancelled, or the provider could not confirm your account. Try again, or sign in with your email.',
    primary: { type: 'login', label: 'Back to sign in' },
  },
  confirm: {
    title: 'That confirmation link did not work',
    description:
      'It may have expired or already been used. If you already confirmed your email, sign in. Otherwise, sign up again for a new link.',
    primary: { type: 'login', label: 'Sign in' },
    secondary: { type: 'register', label: 'Sign up again' },
  },
  reset: {
    title: 'That reset link did not work',
    description:
      'It may have expired or already been used. Request a new one to choose your password.',
    primary: { type: 'forgot-password', label: 'Request a new link' },
    secondary: { type: 'login', label: 'Sign in' },
  },
  'email-change': {
    title: 'That email confirmation link did not work',
    description:
      'It may have expired, been used already, or been opened in a different browser from the one you asked in. Sign in and ask for the change again from your settings.',
    primary: { type: 'login', label: 'Sign in' },
  },
  link: {
    title: 'That account could not be connected',
    description:
      'The sign-in may have been cancelled, or that Google or GitHub account may already be connected to another account. Sign in and try again from your settings.',
    primary: { type: 'login', label: 'Sign in' },
  },
  unknown: {
    title: 'That link did not work',
    description:
      'It may have expired or already been used. Reset your password to get a new link, or sign in another way.',
    primary: { type: 'forgot-password', label: 'Reset password' },
    secondary: { type: 'login', label: 'Sign in' },
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const recovery =
    RECOVERY[parseAuthFlow((await searchParams).reason) ?? 'unknown'];

  return (
    <AuthShell
      title={recovery.title}
      description={recovery.description}
      footer={
        <>
          <AuthLinkButton
            type={recovery.primary.type}
            label={recovery.primary.label}
            variant="default"
            size="lg"
            className="flex-1"
            buttonClassName="w-full"
          />
          {recovery.secondary ? (
            <AuthLinkButton
              type={recovery.secondary.type}
              label={recovery.secondary.label}
              variant="outline"
              size="lg"
              className="flex-1"
              buttonClassName="w-full"
            />
          ) : null}
        </>
      }
    />
  );
}
