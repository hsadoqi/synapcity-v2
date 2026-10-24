import { createServerClient, type CookieOptions } from '@supabase/ssr';

/** The request's cookies, as the host exposes them (Next.js `cookies()`). */
export type RequestCookies = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options: CookieOptions): void;
};

/**
 * A Supabase client bound to one request's cookies. Build one per request and
 * never keep it in a module variable: it carries that caller's session.
 */
export function createRequestClient({
  url,
  publishableKey,
  cookies,
}: {
  url: string;
  publishableKey: string;
  cookies: RequestCookies;
}) {
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
