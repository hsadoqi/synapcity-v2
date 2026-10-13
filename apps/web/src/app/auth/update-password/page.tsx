import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { UpdatePasswordForm } from '@/components/auth/update-password-form';
import { createClient } from '@/lib/supabase/server';
import { UpdatePasswordCard } from '@/components/auth/update-password-card';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function UpdatePasswordPage() {
  // The reset link signs the user in through /auth/callback. Without that
  // session there is nothing to update, so send them back to start over.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect('/auth/forgot-password');

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordCard />
      </div>
    </div>
  );
}
