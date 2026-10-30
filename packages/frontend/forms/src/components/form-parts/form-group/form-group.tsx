'use client';

import type { ReactNode } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleIcon,
  CollapsibleTrigger,
} from '@synapcity/frontend-ui/core/collapsible';
import {
  FieldDescription,
  FieldLegend,
  FieldSet,
} from '@synapcity/frontend-ui/core/field';

import type { FieldGroup } from '../../../types';

export interface FormGroupProps {
  readonly group: FieldGroup;
  readonly id: string;
  /** Used only when the group is collapsible. */
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Fields in the group with an error now; said on a folded group's toggle. */
  readonly errorCount: number;
  readonly children: ReactNode;
}

const errorsLabel = (count: number) =>
  count === 1 ? '1 error' : `${count} errors`;

/**
 * A group of fields as a fieldset with its title as the legend. A collapsible
 * group puts a toggle in the legend; its fields stay mounted while folded, so
 * their values are kept and submitted, and the toggle says how many of them
 * have errors.
 */
export function FormGroup({
  group,
  id,
  open,
  onOpenChange,
  errorCount,
  children,
}: FormGroupProps) {
  const descriptionId = `${id}-description`;
  const description = group.description ? (
    <FieldDescription id={descriptionId}>{group.description}</FieldDescription>
  ) : null;

  if (group.collapsible !== true) {
    return (
      <FieldSet
        aria-describedby={group.description ? descriptionId : undefined}
      >
        <FieldLegend>{group.title}</FieldLegend>
        {description}
        {children}
      </FieldSet>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <FieldSet
        aria-describedby={group.description ? descriptionId : undefined}
      >
        <FieldLegend>
          <CollapsibleTrigger
            render={<Button type="button" variant="ghost" size="sm" />}
          >
            {group.title}
            {!open && errorCount > 0 ? (
              <span className="text-destructive">
                {`(${errorsLabel(errorCount)})`}
              </span>
            ) : null}
            <CollapsibleIcon />
          </CollapsibleTrigger>
        </FieldLegend>
        {description}
        <CollapsibleContent keepMounted className="flex flex-col gap-4">
          {children}
        </CollapsibleContent>
      </FieldSet>
    </Collapsible>
  );
}
