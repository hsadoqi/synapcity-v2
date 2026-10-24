/** One choice of a select field. */
export interface FieldOption {
  readonly value: string;
  readonly label: string;
}

export type ConditionOperator =
  'equals' | 'notEquals' | 'contains' | 'gt' | 'lt' | 'isEmpty';

/** A test on the current value of another field of the same form. */
export interface FieldCondition<TName extends string = string> {
  readonly field: TName;
  readonly operator: ConditionOperator;
  readonly value?: unknown;
}

export type DependencyEffect =
  'show' | 'hide' | 'enable' | 'disable' | 'require';

/** What happens to a field while its conditions are met. */
export interface FieldDependency<TName extends string = string> {
  readonly conditions: readonly FieldCondition<TName>[];
  readonly match: 'all' | 'any';
  readonly effect: DependencyEffect;
}

/** A named run of adjacent fields, rendered as a fieldset with a legend. */
export interface FieldGroup {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
}

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

interface FieldBase<TName extends string> {
  readonly name: TName;
  readonly label: string;
  readonly description?: string;
  readonly group?: string;
  readonly dependencies?: readonly FieldDependency<TName>[];
}

export interface TextFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'text' | 'email' | 'textarea';
  readonly props?: {
    readonly placeholder?: string;
    readonly maxLength?: number;
    readonly autoComplete?: string;
  };
}

export interface PasswordFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'password';
  readonly props: {
    readonly autoComplete: 'current-password' | 'new-password';
    readonly placeholder?: string;
  };
}

export interface NumberFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'number';
  readonly props?: {
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
  };
}

export interface SelectFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'select';
  readonly options: readonly FieldOption[];
  readonly props?: { readonly placeholder?: string };
}

export interface ToggleFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'checkbox' | 'switch';
}

export interface CustomFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: `custom:${string}`;
  readonly props?: Readonly<Record<string, unknown>>;
}

/**
 * How one key of the caller's schema is presented and when it applies. The
 * schema owns validation; a field carries no schema of its own.
 */
export type FieldConfig<TName extends string = string> =
  | TextFieldConfig<TName>
  | PasswordFieldConfig<TName>
  | NumberFieldConfig<TName>
  | SelectFieldConfig<TName>
  | ToggleFieldConfig<TName>
  | CustomFieldConfig<TName>;
