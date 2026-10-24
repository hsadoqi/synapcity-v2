'use client';

import type { LucideIcon } from 'lucide-react';

import { SectionHeading } from '@synapcity/frontend-ui/components/section-heading';
import { Button } from '@synapcity/frontend-ui/core/button';

/** One thing the user can create here: its id is passed back to `onCreate`. */
export type CreateAction = { id: string; label: string; icon: LucideIcon };

type CreateActionsProps = {
  /** The heading's id; the section is labelled by it. Unique on the page. */
  id: string;
  heading: string;
  actions: CreateAction[];
  onCreate?: (id: string) => void;
};

/** A headed row of "New …" buttons, one per thing that can be created. */
export function CreateActions({
  id,
  heading,
  actions,
  onCreate,
}: CreateActionsProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <SectionHeading className="sr-only" id={id}>
        {heading}
      </SectionHeading>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ id: actionId, label, icon: Icon }) => (
          <Button
            key={actionId}
            variant="outline"
            onClick={() => onCreate?.(actionId)}
          >
            <Icon data-icon="inline-start" aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
