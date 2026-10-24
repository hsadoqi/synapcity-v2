import { refreshedLookCookie } from '@synapcity/domain-preferences';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Re-issue a valid shared look from an HTTP response. The browser may still
 * update this display-only cookie directly, but a later request gives it a
 * server-set lifetime as well (notably avoiding Safari's script-storage cap).
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const cookie = refreshedLookCookie(request.headers.get('cookie'), {
    domain: process.env.NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN,
    secure: request.nextUrl.protocol === 'https:',
  });
  if (cookie) response.headers.append('Set-Cookie', cookie);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
