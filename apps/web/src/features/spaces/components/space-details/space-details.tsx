import { useCurrentUser } from '@/features/auth/client';
import type { Space } from '../../shared/types';

export function SpaceDetails({ space }: { space: Space }) {
  const user = useCurrentUser();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {space.name}
      </h1>
      {space.description && (
        <p className="max-w-175 text-lg text-muted-foreground">
          {space.description}
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
          <span className="text-sm font-medium">
            {new Date(space.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
