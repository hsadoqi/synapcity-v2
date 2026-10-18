import { NextResponse } from 'next/server';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { getVerifiedClaims } from '@/features/auth/server/session';
import { findSpace } from '@/features/spaces/server/space-repository';

/** One of the owner's spaces; someone else's is indistinguishable from none. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ spaceId: string }> },
) {
  if (!fixtureModeEnabled() && !(await getVerifiedClaims())) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { spaceId } = await params;
  const space = await findSpace(spaceId);
  if (!space) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(space, { headers: { 'Cache-Control': 'no-store' } });
}
