import { NextResponse } from 'next/server';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { getVerifiedIdentity } from '@/features/auth/server/session';
import { getSpaceSource } from '@/features/spaces/server/space-source';

/** The signed-in owner's spaces. Row-level security does the scoping. */
export async function GET() {
  if (
    !fixtureModeEnabled() &&
    (await getVerifiedIdentity()).status !== 'verified'
  ) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const source = await getSpaceSource();
  return NextResponse.json(await source.list(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
