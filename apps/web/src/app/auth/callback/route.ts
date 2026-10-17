import { NextResponse, type NextRequest } from 'next/server';

import { authErrorPath, parseAuthFlow } from '@/lib/routing/auth-flow';
import { homePathFor } from '@/lib/routing/user-paths';
import { safeNextPath } from '@/lib/routing/safe-next';
import { createClient } from '@/lib/supabase/server';

/**
 * Landing point for every Supabase redirect: OAuth sign-in, the email
 * confirmation link and the password-reset link all return here with a `code`
 * that is exchanged for a session (PKCE).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  // Set by the action that started the flow, so a failure can say which link broke.
  const flow = parseAuthFlow(searchParams.get('flow'));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // No (or an unsafe) `next`: send them to their own home.
      const destination = safeNextPath(next, homePathFor(data.user.id));
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}${authErrorPath(flow)}`);
}
