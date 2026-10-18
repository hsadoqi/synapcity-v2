'use client';

import { toast } from '@synapcity/frontend-ui/core/toast';

import { useCurrentUser } from '@/features/auth/client/user-provider/user-provider';
import { CreateActions } from '@/features/collection/components';

import { CREATE_ACTIONS, OVERVIEW_SECTIONS } from '../../../lib/overview';

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
        Welcome back, {user?.name || 'User'}{' '}
      </h1>
      <div className="text-sm text-muted-foreground">
        <CreateActions
          {...OVERVIEW_SECTIONS.start}
          actions={CREATE_ACTIONS}
          onCreate={(kind) => {
            toast.add({ type: 'success', title: `Created new ${kind}` });
          }}
        />
      </div>
    </header>
  );
}
