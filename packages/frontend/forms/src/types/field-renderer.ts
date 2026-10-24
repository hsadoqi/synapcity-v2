import type { ComponentType, Ref } from 'react';

import type { FieldConfig } from './field-config';

/** What the form hands a renderer for one field. */
export interface FieldRendererProps {
  readonly field: FieldConfig;
  /** A DOM id unique to this field in this form instance. */
  readonly id: string;
  readonly value: unknown;
  onChange(value: unknown): void;
  onBlur(): void;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly required: boolean;
  /** The id of the element that describes the field (its hint and error). */
  readonly describedBy?: string;
  /** Attached to the focusable control, so the form can move focus to it. */
  readonly focusRef?: Ref<HTMLElement>;
}

export type FieldRenderer = ComponentType<FieldRendererProps>;
