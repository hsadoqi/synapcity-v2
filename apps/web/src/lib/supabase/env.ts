/**
 * The Supabase project URL and publishable key, read once and checked.
 *
 * Without this, a missing variable surfaces as Supabase's generic "Your
 * project's URL and Key are required" error on every request, which does not
 * say which variable is missing or where to set it.
 *
 * Each variable is read by its literal name on purpose: Next.js inlines
 * `process.env.NEXT_PUBLIC_*` into the browser bundle at build time only when
 * the name is written out, so a lookup by computed key would be undefined in
 * the browser. Both are public by design (the publishable key is safe in the
 * browser; the secret and service-role keys must never be used here).
 */
export function getSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "hittps://localhost:8080";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Add it to apps/web/.env.local (see the Environment variables table in apps/web/README.md); in CI and deployments it must be set before the build.',
    );
  }
  if (!publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. Add it to apps/web/.env.local (see the Environment variables table in apps/web/README.md); in CI and deployments it must be set before the build.',
    );
  }

  return { url, publishableKey };
}
