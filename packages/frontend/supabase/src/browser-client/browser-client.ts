import { createBrowserClient } from '@supabase/ssr';

/** The values a host supplies; this package reads no environment itself. */
export type BrowserSupabaseConfig = {
  url: string;
  publishableKey: string;
};

/**
 * The browser Supabase client. The host reads its own environment and passes
 * the values in, so the package stays free of `process.env` and `next/*`.
 */
export function createBrowserSupabaseClient({
  url,
  publishableKey,
}: BrowserSupabaseConfig) {
  return createBrowserClient(url, publishableKey);
}
