import type { EntityItem } from '@synapcity/frontend-ui/types/entity';

export function EntityDetails({
  user,
  entity,
}: {
  user?: { name: string };
  entity: EntityItem;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
          <span className="text-sm font-medium">
            {new Date(entity.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
