'use client';

import { formatTime, formatWrittenDate } from '@synapcity/domain-preferences';
import { useDateTimeFormatting } from '@synapcity/frontend-preferences';

import type { EntityItem } from '../../types';

export function EntityDetails({
  user,
  entity,
}: {
  user?: { name: string };
  entity: EntityItem;
}) {
  const formatting = useDateTimeFormatting();
  const created = new Date(entity.createdAt);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
        {entity.name}
      </h1>
      {entity.description && (
        <p className="max-w-175 text-lg text-muted-foreground">
          {entity.description}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Created by
          </span>
          <span className="text-sm font-medium">{user?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Created at
          </span>
          <time dateTime={entity.createdAt} className="text-sm font-medium">
            {formatWrittenDate(created, formatting, {
              weekday: false,
              year: true,
            })}
            , {formatTime(created, formatting)}
          </time>
        </div>
      </div>
    </div>
  );
}
