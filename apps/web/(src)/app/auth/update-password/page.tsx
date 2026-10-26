import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { fixtureModeEnabled } from '../../../../src/lib/access/dev-fixture';
import { createClient } from '../../../../src/lib/supabase/server';
import { safeNextPath } from '../../../../src/lib/routing/safe-next';
import { UpdatePasswordCard } from '@synapcity/features-auth/frontend';
import { updatePassword } from '../../../../src/features/auth/server/actions/actions';

export const metadata: Metadata = { title: 'Choose a password' };

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Fixture mode has no session, so there is nothing to update.
  if (fixtureModeEnabled()) redirect('/');

  // The reset link signs the user in through /auth/callback. Without that
  // session there is nothing to update, so send them back to start over.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect('/auth/forgot-password?expired=1');

  // Empty when absent: the action then picks the user's own home.
  const next = safeNextPath((await searchParams).next, '');

  return <UpdatePasswordCard next={next} updatePassword={updatePassword} />;
}
