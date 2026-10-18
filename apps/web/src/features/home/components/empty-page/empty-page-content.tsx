'use client';

import { House } from 'lucide-react';

import { CreateButton } from '@/features/collection/components';

export function EmptyPageContent({
  title = 'Home',
  description = "A calm place to begin. Pick a thread back up, or start something new when you're ready.",
  icon: Icon = House,
  onCreate,
  singular = 'dcument',
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onCreate: () => void;
  singular?: string;
}) {
  return (
    <section
      aria-labelledby="home-title"
      className="flex flex-col items-center gap-6 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-md border border-border bg-card">
        <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 id="home-title" className="text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-pretty text-muted-foreground">{description}</p>
      </div>
      <CreateButton onCreate={onCreate} singular={singular} />
    </section>
  );
}
