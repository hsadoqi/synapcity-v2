export * from '@synapcity/frontend-ui/types/entity';

/** What pinning a space reports back; `pinnedAt` is the server's own time. */
export type SetSpacePinnedResult =
  | { ok: true; pinnedAt: string | null }
  | { ok: false; error: string; signedOut?: boolean };
