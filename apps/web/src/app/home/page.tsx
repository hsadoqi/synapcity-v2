import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Button } from '@synapcity/frontend-ui/core/button';

import { signOut } from '@/app/auth/actions';
import { CurrentUserAvatar } from '@/components/current-user-avatar';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Home' };

export default async function HomePage() {
  // The proxy already redirects signed-out visitors. Checking again here keeps
  // this page safe if the route policy or the proxy matcher ever changes.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect('/auth/login?next=/home');

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <CurrentUserAvatar />
      <h1>You are signed in</h1>
      <p className="text-sm text-muted-foreground">{data.claims.email}</p>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="lg" label="Sign out">
          Sign out
        </Button>
      </form>
    </div>
  );
}
