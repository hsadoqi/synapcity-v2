import { createRequestClient } from '@synapcity/server-supabase';
import { cookies } from 'next/headers';

import { getSupabaseEnv } from './env';

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 *
 * The host binding for this request: Next.js cookies and the project's
 * environment. The client itself is built by `@synapcity/server-supabase`.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createRequestClient({
    url,
    publishableKey,
    cookies: {
      getAll: () => cookieStore.getAll(),
      set: (name, value, options) => cookieStore.set(name, value, options),
    },
  });
}
