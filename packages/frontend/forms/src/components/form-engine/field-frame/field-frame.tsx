import type { ReactNode } from 'react';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@synapcity/frontend-ui/core/field';

/** The ids a field's label, description, error and status use, derived from the control's id. */
export function fieldIds(id: string) {
  return {
    label: `${id}-label`,
    description: `${id}-description`,
    error: `${id}-error`,
    status: `${id}-status`,
    required: `${id}-required`,
  };
}

/**
 * What the control's `aria-describedby` should be: its description, its
 * error, then the spoken "required" for a control that cannot carry
 * `aria-required`.
 */
export function fieldDescribedBy(
  id: string,
  {
    description,
    error,
    requiredHint,
  }: { description?: boolean; error?: boolean; requiredHint?: boolean },
): string | undefined {
  const ids = fieldIds(id);
  return (
    [
      description ? ids.description : undefined,
      error ? ids.error : undefined,
      requiredHint ? ids.required : undefined,
    ]
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
  /** Puts an asterisk beside the label that assistive tech skips; the control carries the requirement. */
  readonly required?: boolean;
  /**
   * Text read through `aria-describedby` for a required control that cannot
   * carry `aria-required` (a button, a colour input). Rendered only when set.
   */
  readonly requiredHint?: string;
  /**
   * Progress for a field with an async check, such as `Validating…`. When
   * `live` is set, a polite status region is always rendered, so the text is
   * announced when it appears.
   */
  readonly status?: string;
  readonly live?: boolean;
  /** Toggles sit beside their label. */
  readonly orientation?: 'vertical' | 'horizontal';
  readonly children: ReactNode;
}

/**
 * A label, the control, an optional description, an optional status and an
 * optional error, built from frontend-ui's field pieces. The control is passed
 * in as `children` and points `aria-describedby` at the ids
 * `fieldDescribedBy` returns.
 */
export function FieldFrame({
  id,
  label,
  description,
  error,
  required = false,
  requiredHint,
  status,
  live = false,
  orientation = 'vertical',
  children,
}: FieldFrameProps) {
  const ids = fieldIds(id);
  const labelOnly = (
    <FieldLabel id={ids.label} htmlFor={id}>
      {label}
    </FieldLabel>
  );
  // The marker sits beside the label, not in it, so the label's text (and
  // every lookup by label) stays exactly the field's label.
  const labelElement = required ? (
    <div className="flex items-center gap-0.5">
      {labelOnly}
      <span aria-hidden="true" className="text-sm text-destructive">
        *
      </span>
    </div>
  ) : (
    labelOnly
  );
  const descriptionElement = description ? (
    <FieldDescription id={ids.description}>{description}</FieldDescription>
  ) : null;
  return (
    <Field orientation={orientation} data-invalid={error ? true : undefined}>
      {orientation === 'horizontal' ? (
        <>
          {children}
          <FieldContent>
            {labelElement}
            {descriptionElement}
          </FieldContent>
        </>
      ) : (
        <>
          {labelElement}
          {children}
          {descriptionElement}
        </>
      )}
      {requiredHint ? (
        <span id={ids.required} className="sr-only">
          {requiredHint}
        </span>
      ) : null}
      {live ? (
        <p
          id={ids.status}
          role="status"
          className="text-xs text-muted-foreground empty:hidden"
        >
          {status}
        </p>
      ) : null}
      {error ? <FieldError id={ids.error}>{error}</FieldError> : null}
    </Field>
  );
}
