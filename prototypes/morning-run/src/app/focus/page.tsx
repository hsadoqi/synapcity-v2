import type { Metadata } from 'next';

import { FocusSession } from '@/components/focus/focus-session';

export const metadata: Metadata = { title: 'Focus' };

export default function Page() {
  return <FocusSession />;
}
