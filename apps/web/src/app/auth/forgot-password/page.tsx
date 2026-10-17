import type { Metadata } from 'next';

import { ForgotPasswordCard } from '@/features/auth/components/forgot-password-card';

export const metadata: Metadata = { title: 'Reset your password' };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  // Set by /auth/update-password when someone arrives without a valid reset link.
  const expired = (await searchParams).expired === '1';

  return <ForgotPasswordCard expired={expired} />;
}
