import {
  currentUserFromClaims,
  type CurrentUser,
} from '@synapcity/domain-identity';

/**
 * Development-only fixture identity (ADR-0006, development amendment). It lets
 * the owner-area pages be browsed without a Supabase project. It is never a
 * verified claim: `getVerifiedClaims` does not know about it, and it cannot
 * mutate anything, because every action rejects before a client is built.
 */
export const FIXTURE_USER_ID = 'fixture-user';

export const FIXTURE_MESSAGE =
  'Fixture mode is on, so signing in and saving are unavailable. Unset SYNAPCITY_DEV_AUTH to use real sign-in.';

/**
 * Read on every call, not at import, so tests and a restarted dev server see
 * the current environment. Production and test can never take this branch,
 * whatever the flag says.
 */
export function fixtureModeEnabled(): boolean {
  // Both are declared in turbo.json: NODE_ENV in `build.env`,
  // SYNAPCITY_DEV_AUTH in `globalPassThroughEnv`.
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.SYNAPCITY_DEV_AUTH === 'fixture'
  );
}

export const fixtureClaims = {
  sub: FIXTURE_USER_ID,
  email: 'fixture@localhost',
  user_metadata: { full_name: 'Fixture user' },
};

export function fixtureUser(): CurrentUser {
  return { ...currentUserFromClaims(fixtureClaims), fixture: true };
}
