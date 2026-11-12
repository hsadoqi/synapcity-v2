import {
  profileSetupStateOf,
  type ProfileSetupState,
} from '@synapcity/domain-identity';
import {
  toProviderFailure,
  type MetadataPatch,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { withProfileNames } from '../profile-metadata';

/** Postgres `check_violation`: here, completion without a valid first name. */
const CHECK_VIOLATION = '23514';

export type ProfileSetupRead =
  | {
      kind: 'found';
      state: ProfileSetupState;
      completedAt: string | null;
      skippedAt: string | null;
      firstName: string | null;
      lastName: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    }
  | { kind: 'missing' }
  | { kind: 'failed'; failure: ProviderFailure };

/**
 * The caller's own profile names and where they are with the setup step, read
 * from the database (the timestamps there are the record; token metadata is
 * not).
 */
export async function readProfileSetup(
  client: SupabaseServerClient,
  userId: string,
): Promise<ProfileSetupRead> {
  const { data, error } = await client
    .from('profiles')
    .select(
      'first_name, last_name, display_name, avatar_url, profile_completed_at, profile_setup_skipped_at',
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) return { kind: 'failed', failure: toProviderFailure(error) };
  if (!data) return { kind: 'missing' };
  return {
    kind: 'found',
    state: profileSetupStateOf({
      completedAt: data.profile_completed_at,
      skippedAt: data.profile_setup_skipped_at,
    }),
    completedAt: data.profile_completed_at,
    skippedAt: data.profile_setup_skipped_at,
    firstName: data.first_name,
    lastName: data.last_name,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
  };
}

/** Already-validated names, as the profile forms submit them. */
export type ProfileNames = {
  firstName: string;
  lastName: string | null;
  /** The person's own display name, or null to show their first name. */
  displayName: string | null;
};

export type ProfileNamesSaved =
  | { ok: true; patch: MetadataPatch }
  | {
      ok: false;
      /**
       * `first-name-required`: the database refused completion without a valid
       * first name. `not-saved`: anything else, with its failure.
       */
      reason: 'first-name-required' | 'not-saved';
      failure: ProviderFailure;
    };

/**
 * Saves the names and marks profile setup completed, in one statement, so
 * names and completion are never saved apart. The completion time is the
 * database's: the stamping trigger replaces the value sent, and keeps the
 * first one once set, so saving names again never moves it. The returned
 * patch mirrors the names into the token metadata for the header.
 */
export async function saveProfileNames(
  client: SupabaseServerClient,
  userId: string,
  names: ProfileNames,
): Promise<ProfileNamesSaved> {
  const { data, error } = await client
    .from('profiles')
    .update({
      first_name: names.firstName,
      last_name: names.lastName,
      display_name: names.displayName,
      profile_completed_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id');
  if (error) {
    const failure = toProviderFailure(error);
    return {
      ok: false,
      reason:
        failure.code === CHECK_VIOLATION ? 'first-name-required' : 'not-saved',
      failure,
    };
  }
  if (!data?.length) {
    return {
      ok: false,
      reason: 'not-saved',
      failure: { code: 'profile_row_missing' },
    };
  }
  return { ok: true, patch: (existing) => withProfileNames(existing, names) };
}

export type ProfileSetupSkipped =
  | { kind: 'skipped' }
  /** Already completed: a skip changes nothing. */
  | { kind: 'already-completed' }
  | { kind: 'failed'; failure: ProviderFailure };

/**
 * Records that the person skipped profile setup. Only an incomplete setup can
 * be skipped: the write is conditional on `profile_completed_at` being null,
 * so it never undoes a completion. Skipping twice keeps the first time.
 */
export async function skipProfileSetup(
  client: SupabaseServerClient,
  userId: string,
): Promise<ProfileSetupSkipped> {
  const { data, error } = await client
    .from('profiles')
    .update({ profile_setup_skipped_at: new Date().toISOString() })
    .eq('id', userId)
    .is('profile_completed_at', null)
    .select('id');
  if (error) return { kind: 'failed', failure: toProviderFailure(error) };
  if (data?.length) return { kind: 'skipped' };

  const read = await readProfileSetup(client, userId);
  if (read.kind === 'found' && read.state === 'completed') {
    return { kind: 'already-completed' };
  }
  return {
    kind: 'failed',
    failure:
      read.kind === 'failed' ? read.failure : { code: 'profile_row_missing' },
  };
}
