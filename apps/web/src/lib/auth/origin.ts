import { headers } from 'next/headers';

/**
 * The origin of the current request, used to build the redirect URLs that
 * Supabase embeds in emails and OAuth flows. Supabase only honours URLs on its
 * redirect allow-list, so a forged header cannot send a user elsewhere.
 */
export async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();

  const origin = requestHeaders.get('origin');
  if (origin) return origin;

  const host =
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  return `${protocol}://${host}`;
}
