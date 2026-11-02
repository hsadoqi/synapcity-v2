import type { z } from 'zod';
import type { FieldConfig } from './field-config';
import type { FieldGroup, FieldNamesOf, FormRule } from './field-renderer';

export type FormDefinitionIssueCode =
  | 'duplicate-name'
  | 'unknown-field'
  | 'unknown-reference'
  | 'unknown-group'
  | 'split-group'
  | 'schema-has-refinements'
  | 'reserved-name'
  | 'cannot-infer'
  | 'pattern-mismatch'
  | 'cycle';

/** One problem found while checking a form definition. Names only, never values. */
export interface FormDefinitionIssue {
  readonly code: FormDefinitionIssueCode;
  readonly name: string;
  readonly path?: readonly string[];
}

export interface DefineFormInput<TSchema extends z.ZodObject> {
  readonly schema: TSchema;
  readonly fields: readonly FieldConfig<FieldNamesOf<TSchema>>[];
  readonly groups?: readonly FieldGroup[];
  readonly rules?: readonly FormRule<FieldNamesOf<TSchema>>[];
}

/** A checked form: the caller's schema plus how each key is presented. */
export interface FormDefinition<TSchema extends z.ZodObject = z.ZodObject> {
  readonly schema: TSchema;
  readonly rules: readonly FormRule<FieldNamesOf<TSchema>>[];
  readonly fields: readonly FieldConfig<FieldNamesOf<TSchema>>[];
  readonly groups: readonly FieldGroup[];
  /** True for a field whose schema key accepts neither `undefined` nor `null`. */
  readonly baseRequired: Readonly<Record<string, boolean>>;
  /** Field names with every field after the fields its conditions read. */
  readonly evaluationOrder: readonly string[];
}
