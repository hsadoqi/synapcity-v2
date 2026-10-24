import type { ReactNode } from 'react';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@synapcity/frontend-ui/core/field';

/** The ids a field's label, description and error use, derived from the control's id. */
export function fieldIds(id: string) {
  return {
    label: `${id}-label`,
    description: `${id}-description`,
    error: `${id}-error`,
  };
}

/** What the control's `aria-describedby` should be: its description, then its error. */
export function fieldDescribedBy(
  id: string,
  { description, error }: { description?: boolean; error?: boolean },
): string | undefined {
  const ids = fieldIds(id);
  return (
    [description ? ids.description : undefined, error ? ids.error : undefined]
      .filter(Boolean)
      .join(' ') || undefined
  );
}

export interface FieldFrameProps {
  /** The control's id. */
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly error?: string;
  /** Toggles sit beside their label. */
  readonly orientation?: 'vertical' | 'horizontal';
  readonly children: ReactNode;
}

/**
 * A label, the control, an optional description and an optional error, built
 * from frontend-ui's field pieces. The control is passed in as `children` and
 * points `aria-describedby` at the ids `fieldDescribedBy` returns.
 */
export function FieldFrame({
  id,
  label,
  description,
  error,
  orientation = 'vertical',
  children,
}: FieldFrameProps) {
  const ids = fieldIds(id);
  const labelElement = (
    <FieldLabel id={ids.label} htmlFor={id}>
      {label}
    </FieldLabel>
  );
  return (
    <Field orientation={orientation} data-invalid={error ? true : undefined}>
      {orientation === 'horizontal' ? (
        <>
          {children}
          <FieldContent>
            {labelElement}
            {description ? (
              <FieldDescription id={ids.description}>
                {description}
              </FieldDescription>
            ) : null}
          </FieldContent>
        </>
      ) : (
        <>
          {labelElement}
          {children}
          {description ? (
            <FieldDescription id={ids.description}>
              {description}
            </FieldDescription>
          ) : null}
        </>
      )}
      {error ? <FieldError id={ids.error}>{error}</FieldError> : null}
    </Field>
  );
}
