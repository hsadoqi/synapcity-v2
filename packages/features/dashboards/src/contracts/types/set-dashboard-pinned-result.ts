/** What pinning a dashboard reports back; `pinnedAt` is the server's own time. */
export type SetDashboardPinnedResult =
  | { ok: true; pinnedAt: string | null }
  | { ok: false; error: string; signedOut?: boolean };
