import type { ComponentType, Ref } from 'react';

import type { FieldConfig } from './field-config';
import z from 'zod';

/**
 * A cross-field rule. It runs only while every field it reads is visible, and
 * its message lands on `path`. Object-level refinements on the schema are
 * rejected by `defineForm`, so rules are how cross-field checks reach a form.
 */
export interface FormRule<TName extends string = string> {
  readonly fields: readonly TName[];
  readonly path: TName;
  check(values: Readonly<Partial<Record<TName, unknown>>>): string | undefined;
}

/** A named run of adjacent fields, rendered as a fieldset with a legend. */
export interface FieldGroup {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  /**
   * The group can be folded away behind its title. Its fields stay mounted
   * while folded, so their values are kept and submitted, and a failed submit
   * unfolds every group that holds an error before moving focus.
   */
  readonly collapsible?: boolean;
  /** Whether a collapsible group starts unfolded. Defaults to `true`. */
  readonly defaultOpen?: boolean;
}

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

/** The string keys of a schema's inferred shape: the names a field may take. */
export type FieldNamesOf<TSchema extends z.ZodObject> = Extract<
  keyof z.infer<TSchema>,
  string
>;

/** Whether a field is shown, editable and required for the current values. */
export interface FieldState {
  readonly visible: boolean;
  readonly enabled: boolean;
  readonly required: boolean;
}
