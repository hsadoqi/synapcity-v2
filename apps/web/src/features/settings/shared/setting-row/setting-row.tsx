'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@synapcity/frontend-ui/core/field';
import { useSettingsDraftFields } from '../settings-drafts/settings-draft-fields';

type SettingRowProps = {
  id: string;
  label: string;
  description: ReactNode;
  children: ReactNode;
  /** Dims the label to match a disabled control. The control is disabled by its owner. */
  disabled?: boolean;
  /**
   * The control is a switch. It stays at the row's end at every width, centred
   * on the label and description, instead of dropping under them when narrow.
   */
  toggle?: boolean;
  /**
   * The setting this row edits, as named in its section of the settings. In a
   * tab with a draft, the row then marks itself while unsaved and offers to
   * reset itself while it differs from its default.
   */
  field?: string;
};

export function SettingRow({
  id,
  label,
  description,
  children,
  disabled,
  toggle,
  field,
}: SettingRowProps) {
  const draft = useSettingsDraftFields();
  const unsaved = field !== undefined && draft?.isUnsaved(field);
  const resettable = field !== undefined && draft && !draft.isDefault(field);
  return (
    // Capped, so on a wide page the label and its control stay within one
    // glance of each other while the card and its sections use the full width.
    <Field
      orientation={toggle ? 'horizontal' : 'responsive'}
      data-disabled={disabled || undefined}
      className="max-w-3xl"
    >
      <FieldContent>
        <div className="flex items-center gap-2">
          {unsaved && (
            <>
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              <span className="sr-only">Unsaved:</span>
            </>
          )}
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {/* Puts the default into the draft; Save keeps it, Discard undoes it. */}
          {resettable && (
            <Button
              type="button"
              variant="subtle"
              size="xs"
              aria-label={`Reset ${label}`}
              onClick={() => draft.resetField(field)}
            >
              Reset
            </Button>
          )}
        </div>
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      </FieldContent>
      <div className={cn('shrink-0', toggle && 'self-center')}>{children}</div>
    </Field>
  );
}
