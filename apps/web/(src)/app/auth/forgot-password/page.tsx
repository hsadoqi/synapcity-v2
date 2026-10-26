import type { Metadata } from 'next';

import { ForgotPasswordCard } from '@synapcity/features-auth/frontend';
import { requestPasswordReset } from '../../../../src/features/auth/server/actions/actions';

export const metadata: Metadata = { title: 'Reset your password' };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  // Set by /auth/update-password when someone arrives without a valid reset link.
  const expired = (await searchParams).expired === '1';

  return (
    <ForgotPasswordCard
      expired={expired}
      requestPasswordReset={requestPasswordReset}
    />
  );
}
