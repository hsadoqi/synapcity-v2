import type { NextRequest } from 'next/server';
import { refreshedLookCookie } from '@synapcity/domain-preferences';

import { updateSession } from './lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const cookie = refreshedLookCookie(request.headers.get('cookie'), {
    domain: process.env.NEXT_PUBLIC_PREFERENCES_COOKIE_DOUGH,
    secure: request.nextUrl.protocol === 'https:',
  });
  // Append rather than replace: Supabase may have refreshed auth cookies on
  // this same response, including redirects.
  if (cookie) response.headers.append('Set-Cookie', cookie);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
