import {
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import {
  recordRecordView,
  setRecordPinned,
  type PinnedOutcome,
} from '../../records';

/** Pins or unpins one of the caller's spaces (see `setRecordPinned`). */
export function setSpacePinned(
  client: SupabaseServerClient,
  spaceId: string,
  pinned: boolean,
): Promise<PinnedOutcome> {
  return setRecordPinned(client, 'spaces', spaceId, pinned);
}

/**
 * Notes that the caller opened one of their spaces (see `recordRecordView`).
 */
export function recordSpaceView(
  client: SupabaseServerClient,
  spaceId: string,
  now: Date,
): Promise<{ ok: true } | { ok: false; error: ProviderFailure }> {
  return recordRecordView(client, 'spaces', spaceId, now);
}

// export function addDocumentToSpace(
//   client: SupabaseServerClient,
//   spaceId: string,
//   now: Date,
// ) {
//   return recordRecordView(client, 'spaces', spaceId, now);
// }

// export function addDashboardToSpace(
//   client: SupabaseServerClient,
//   spaceId: string,
//   now: Date,
// ) {
//   return recordRecordView(client, 'spaces', spaceId, now);
// }
