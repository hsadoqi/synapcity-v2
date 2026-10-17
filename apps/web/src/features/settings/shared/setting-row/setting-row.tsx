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
};

export function SettingRow({
  id,
  label,
  description,
  children,
}: SettingRowProps) {
  return (
    <Field orientation="responsive">
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
