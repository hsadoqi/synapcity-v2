import { createServerClient } from '@supabase/ssr';
import { readClaims } from '@synapcity/server-supabase/claims';
import { NextResponse, type NextRequest } from 'next/server';

import { homePathFor } from '../routing/user-paths';
import { safeNextPath } from '../routing/safe-next';
import { fixtureModeEnabled } from '../access/dev-fixture';
import { REQUEST_PATH_HEADER } from '../routing/request-path';
import { getSupabaseEnv } from './env';
import {
  AUTH_UNAVAILABLE_HEADER,
  AUTH_UNAVAILABLE_PATH,
} from '../routing/auth-unavailable';
import { isGuestOnlyPath, isProtectedPath } from '../routing/route-access';

export async function updateSession(request: NextRequest) {
  // Always replaces a client-sent value, so server code can trust where it came
  // from (its content is still validated by `safeNextPath` where it is used).
  request.headers.set(
    REQUEST_PATH_HEADER,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  // Only the proxy says Auth is unavailable; never take it from the client.
  request.headers.delete(AUTH_UNAVAILABLE_HEADER);

  // Development fixture mode has no session to refresh and must not reach
  // Supabase. Production and test never take this branch.
  if (fixtureModeEnabled()) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({
    request,
  });
  // The SDK sends cache headers with the first cookie write only, so a page
  // that sets session cookies is never stored by a shared cache. Every
  // response this proxy returns, redirects included, has to carry them.
  let cacheHeaders: Record<string, string> = {};

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        cacheHeaders = { ...cacheHeaders, ...headers };
        Object.entries(cacheHeaders).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  /**
   * A redirect replaces `supabaseResponse`, so it must take over the session
   * cookies getClaims() just refreshed (or the user is signed out) and the
   * cache headers that came with them.
   */
  function redirectWithSession(destination: URL) {
    const redirect = NextResponse.redirect(destination);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirect.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) =>
      redirect.headers.set(key, value),
    );
    return redirect;
  }

  /**
   * The Auth service could not answer, so nothing is known about the session.
   * A protected page then says so instead of sending a signed-in person to
   * sign in. The response keeps the cookies and cache headers of
   * `supabaseResponse`, and is never stored. Next serves a rewrite with the
   * destination page's own status, so this page is a 200 (checked on Next
   * 16.4.3); the API routes, which set their own status, answer 503.
   */
  function unavailableResponse() {
    // The rewritten request carries the finding, so its render does not ask
    // the Auth service again.
    const headers = new Headers(request.headers);
    headers.set(AUTH_UNAVAILABLE_HEADER, '1');
    const rewrite = NextResponse.rewrite(
      new URL(AUTH_UNAVAILABLE_PATH, request.url),
      { request: { headers } },
    );
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => rewrite.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) =>
      rewrite.headers.set(key, value),
    );
    rewrite.headers.set('Cache-Control', 'no-store');
    return rewrite;
  }

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  // `readClaims` calls it and keeps the three answers apart: only an answered
  // "no session" is signed out; an outage is not.
  const result = await readClaims(supabase);
  const user = result.status === 'verified' ? result.claims : null;

  if (
    result.status === 'unavailable' &&
    isProtectedPath(request.nextUrl.pathname)
  ) {
    return unavailableResponse();
  }

  if (
    result.status === 'signed-out' &&
    isProtectedPath(request.nextUrl.pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = '';
    // Keep the query so the visitor lands on the same view after signing in.
    // `request.nextUrl` is untouched by the clone above; the value is still
    // validated by `safeNextPath` where it is used.
    url.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return redirectWithSession(url);
  }

  if (user && isGuestOnlyPath(request.nextUrl.pathname)) {
    const destination = new URL(
      safeNextPath(
        request.nextUrl.searchParams.get('next'),
        homePathFor(user.sub),
      ),
      request.url,
    );
    // safeNextPath only returns same-origin paths. Assert it anyway, so a later
    // change to that helper cannot turn this into an open redirect.
    if (destination.origin !== request.nextUrl.origin) return supabaseResponse;
    return redirectWithSession(destination);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
