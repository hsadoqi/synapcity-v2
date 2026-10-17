import type { ReactNode } from 'react';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@synapcity/frontend-ui/components/ui/field';

type SettingRowProps = {
  id: string;
  label: string;
  description: ReactNode;
  children: ReactNode;
  /** Dims the label to match a disabled control. The control is disabled by its owner. */
  disabled?: boolean;
};

export function SettingRow({
  id,
  label,
  description,
  children,
  disabled,
}: SettingRowProps) {
  return (
    <Field orientation="responsive" data-disabled={disabled || undefined}>
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      </FieldContent>
      <div className="shrink-0">{children}</div>
    </Field>
  );
}
