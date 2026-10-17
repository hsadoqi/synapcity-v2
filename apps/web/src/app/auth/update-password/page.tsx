import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/routing/safe-next';
import { UpdatePasswordCard } from '@/features/auth/components/password/update-password/update-password-card';

export const metadata: Metadata = { title: 'Choose a password' };

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // The reset link signs the user in through /auth/callback. Without that
  // session there is nothing to update, so send them back to start over.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect('/auth/forgot-password?expired=1');

  // Empty when absent: the action then picks the user's own home.
  const next = safeNextPath((await searchParams).next, '');

  return <UpdatePasswordCard next={next} />;
}
