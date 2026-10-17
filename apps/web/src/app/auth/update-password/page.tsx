import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';
import { UpdatePasswordCard } from '@/features/auth/components/update-password-card';

export const metadata: Metadata = { title: 'Choose a password' };

export default async function UpdatePasswordPage() {
  // Fixture mode has no session, so there is nothing to update.
  if (fixtureModeEnabled()) redirect('/');

  // The reset link signs the user in through /auth/callback. Without that
  // session there is nothing to update, so send them back to start over.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect('/auth/forgot-password?expired=1');

  return <UpdatePasswordCard />;
}
