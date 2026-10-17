import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { UpdatePasswordCard } from '@/components/auth/update-password/update-password-card';

export const metadata: Metadata = { title: 'Choose a password' };

export default async function UpdatePasswordPage() {
  // The reset link signs the user in through /auth/callback. Without that
  // session there is nothing to update, so send them back to start over.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect('/auth/forgot-password?expired=1');

  return <UpdatePasswordCard />;
}
