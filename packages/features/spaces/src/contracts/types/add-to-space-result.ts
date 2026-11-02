/**
 * What adding a document or dashboard to a space reports back. Adding is
 * idempotent, so `ok: true` also covers an item that was already there, and a
 * failure is always safe to retry.
 */
export type AddToSpaceResult =
  { ok: true } | { ok: false; error: string; signedOut?: boolean };
