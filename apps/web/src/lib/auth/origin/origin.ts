/**
 * The public origin of this app, used to build the redirect URLs that Supabase
 * embeds in confirmation emails, password-reset emails and OAuth flows.
 *
 * It comes from configuration (`SITE_URL`), never from request headers. A
 * request's `Origin` and `Host` are chosen by whoever sends it, so deriving the
 * link from them would let an attacker aim a victim's reset email at their own
 * site whenever the Supabase redirect allow-list is loose (for example a
 * `*.vercel.app` wildcard for previews).
 *
 * `SITE_URL` is server-only on purpose, so it is not prefixed `NEXT_PUBLIC_`.
 */
export function getOrigin(): string {
  const raw = process.env.SITE_URL;
  if (!raw) {
    throw new Error(
      'SITE_URL is not set. Set it to the public origin of this app, for example http://localhost:8080.',
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`SITE_URL is not a valid URL: ${raw}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`SITE_URL must start with http:// or https://: ${raw}`);
  }

  // `.origin` drops any path, query or trailing slash.
  return url.origin;
}
