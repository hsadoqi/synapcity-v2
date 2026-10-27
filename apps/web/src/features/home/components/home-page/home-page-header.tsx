'use client';

import { useCurrentUser } from '@synapcity/features-auth/frontend';

/** Today's date, a greeting and the quick ways to create something. */
export function HomePageHeader({
  dateLabel,
  dateTime,
}: {
  dateLabel: string;
  dateTime: string;
}) {
  const user = useCurrentUser();
  return (
    <header className="flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">
        <time dateTime={dateTime}>{dateLabel}</time>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
      </h1>
    </header>
  );
}
