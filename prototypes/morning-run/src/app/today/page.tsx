import type { Metadata } from 'next';

import { TodayScreen } from '@/components/today/today-screen';

export const metadata: Metadata = { title: 'Today' };

export default function Page() {
  return <TodayScreen />;
}
