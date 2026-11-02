import { createServerClient, type CookieOptions } from '@supabase/ssr';

import type { Database } from '../database-types';

/** The request's cookies, as the host exposes them (Next.js `cookies()`). */
export type RequestCookies = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options: CookieOptions): void;
};

/**
 * Where the host puts the response headers the SDK asks for with a session
 * write (`Cache-Control`, `Expires`, `Pragma`), so a response that carries a
 * refreshed token is never stored by a shared cache. Next.js owns the response,
 * so the host decides how they reach it.
 */
export type ResponseHeadersSink = (headers: Record<string, string>) => void;

/**
 * The client a request builds; what data modules take as their first argument.
 * Typed from the generated `Database`, so queries and rows are checked against
 * the schema (`pnpm db:types`).
 */
export type SupabaseServerClient = ReturnType<typeof createRequestClient>;

/**
 * A Supabase client bound to one request's cookies. Build one per request and
 * never keep it in a module variable: it carries that caller's session.
 */
export function createRequestClient({
  url,
  publishableKey,
  cookies,
  onResponseHeaders,
}: {
  url: string;
  publishableKey: string;
  cookies: RequestCookies;
  onResponseHeaders?: ResponseHeadersSink;
}) {
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Headers are handed over even when the cookie write below is refused:
        // a Server Component cannot set cookies, but the response is still
        // the one that must not be cached.
        if (headers && Object.keys(headers).length > 0) {
          onResponseHeaders?.(headers);
        }
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
