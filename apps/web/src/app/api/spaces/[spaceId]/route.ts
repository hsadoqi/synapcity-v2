import { NextResponse } from 'next/server';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { getVerifiedIdentity } from '@/features/auth/server/session';
import { getSpaceSource } from '@/lib/spaces';

/** One of the owner's spaces; someone else's is indistinguishable from none. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ spaceId: string }> },
) {
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

  const { spaceId } = await params;
  const space = await (await getSpaceSource()).find(spaceId);
  if (!space) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(space, { headers: { 'Cache-Control': 'no-store' } });
}
