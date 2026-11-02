import { NextResponse } from 'next/server';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { getVerifiedIdentity } from '@/features/auth/server/session';
import { getSpaceSource } from '@/lib/spaces';

/** The signed-in owner's spaces. Row-level security does the scoping. */
export async function GET() {
  if (!fixtureModeEnabled()) {
    const identity = await getVerifiedIdentity();
    // An Auth outage is not a sign-out: 503 tells the caller to retry.
    if (identity.status === 'unavailable') {
      return NextResponse.json(
        { error: 'Sign-in service unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (identity.status !== 'verified') {
      return NextResponse.json(
        { error: 'Not signed in' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  const source = await getSpaceSource();
  return NextResponse.json(await source.list(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
