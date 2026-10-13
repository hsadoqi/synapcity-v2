import type { Metadata } from 'next';

import { safeNextPath } from '@/lib/auth/safe-next/safe-next';
import { RegisterCard } from '@/components/auth/register/register-card';

export const metadata: Metadata = { title: 'Sign up' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Empty when absent: the server action then picks the user's own home.
  const next = safeNextPath((await searchParams).next, '');

  return <RegisterCard next={next} />;
}
