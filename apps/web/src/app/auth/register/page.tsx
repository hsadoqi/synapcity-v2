import type { Metadata } from 'next';

import { safeNextPath } from '@/lib/auth/safe-next';
import { RegisterCard } from '@/components/auth/register-card';

export const metadata: Metadata = { title: 'Create an account' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);

  return (
    <div className="flex size-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RegisterCard next={next} />
      </div>
    </div>
  );
}
