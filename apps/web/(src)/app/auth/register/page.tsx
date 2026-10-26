import type { Metadata } from 'next';

import { safeNextPath } from '../../../../src/lib/routing/safe-next';
import { RegisterCard } from '@synapcity/features-auth/frontend';
import {
  resendConfirmation,
  signInWithOAuth,
  signUp,
} from '../../../../src/features/auth/server/actions/actions';

export const metadata: Metadata = { title: 'Sign up' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Empty when absent: the server action then picks the user's own home.
  const next = safeNextPath((await searchParams).next, '');

  return (
    <RegisterCard
      next={next}
      signUp={signUp}
      resendConfirmation={resendConfirmation}
      signInWithOAuth={signInWithOAuth}
    />
  );
}
