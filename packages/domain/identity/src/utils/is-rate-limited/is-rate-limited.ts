/**
 * Whether a Supabase Auth error code means "slow down". These say nothing about
 * any account, so they are safe to show even where every other error is
 * answered identically to avoid account discovery.
 */
export function isRateLimited(code: string | undefined): boolean {
  return (
    code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit'
  );
}
