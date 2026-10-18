import { notFound } from 'next/navigation';

import { spaceSchema } from '../../shared/schema';
import type { Space } from '../../shared/types';

export async function getSpace(spaceId: string): Promise<Space> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(
    `${baseUrl}/api/spaces/${encodeURIComponent(spaceId)}`,
    { cache: 'no-store' },
  );

  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch space ${spaceId}: ${res.status}`);
  }

  return spaceSchema.parse(await res.json());
}
