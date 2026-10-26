/** What pinning a document reports back; `pinnedAt` is the server's own time. */
export type SetDocumentPinnedResult =
  | { ok: true; pinnedAt: string | null }
  | { ok: false; error: string; signedOut?: boolean };
