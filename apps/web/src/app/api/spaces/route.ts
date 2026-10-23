import { NextResponse } from 'next/server';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { getVerifiedClaims } from '@/features/auth/server/session';
import { listSpaces } from '@/features/spaces/server/space-repository';

/** The signed-in owner's spaces. Row-level security does the scoping. */
export async function GET() {
  if (!fixtureModeEnabled() && !(await getVerifiedClaims())) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  return NextResponse.json(await listSpaces(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
