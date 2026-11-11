import {
  createRequestClient,
  type ResponseHeadersSink,
} from '@synapcity/server-supabase';
import { cookies } from 'next/headers';

import { getSupabaseEnv } from './env';

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 *
 * The host binding for this request: Next.js cookies and the project's
 * environment. The client itself is built by `@synapcity/server-supabase`.
 *
 * A Route Handler that builds its own response passes `onResponseHeaders` and
 * copies what it receives onto that response: the SDK asks for them with a
 * session write so the response is never stored by a shared cache, and Next.js
 * gives the handler no other way to add them. Pages and Server Actions leave it
 * out; the proxy refreshes their sessions and sets the headers itself.
 */
export async function createClient({
  onResponseHeaders,
}: { onResponseHeaders?: ResponseHeadersSink } = {}) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createRequestClient({
    url,
    publishableKey,
    cookies: {
      getAll: () => cookieStore.getAll(),
      set: (name, value, options) => cookieStore.set(name, value, options),
    },
    onResponseHeaders,
  });
}
