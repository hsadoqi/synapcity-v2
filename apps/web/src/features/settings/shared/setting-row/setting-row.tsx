import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@synapcity/frontend-ui/core/field';

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
};

export function SettingRow({
  id,
  label,
  description,
  children,
  disabled,
  toggle,
}: SettingRowProps) {
  return (
    <Field
      orientation={toggle ? 'horizontal' : 'responsive'}
      data-disabled={disabled || undefined}
    >
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      </FieldContent>
      <div className={cn('shrink-0', toggle && 'self-center')}>{children}</div>
    </Field>
  );
}
