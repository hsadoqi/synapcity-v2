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

export type InputMode =
  'text' | 'email' | 'tel' | 'url' | 'search' | 'numeric' | 'decimal' | 'none';

/** A single-line text entry (or a textarea). `inputMode` overrides the keyboard the type implies. */
export interface TextFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'text' | 'email' | 'tel' | 'url' | 'search' | 'textarea';
  readonly props?: {
    readonly placeholder?: string;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly autoComplete?: string;
    readonly inputMode?: InputMode;
    /** A browser hint only: the schema decides. Keep the two in step. */
    readonly pattern?: string;
  };
}

export interface PasswordFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'password';
  readonly props: {
    readonly autoComplete: 'current-password' | 'new-password';
    readonly placeholder?: string;
    readonly minLength?: number;
    readonly maxLength?: number;
  };
}

/**
 * A date, time, month, week or colour picker. The value is the string the
 * browser gives (`2026-05-04`, `09:30`, or `#rrggbb` for a colour); nothing chosen is `''`.
 */
export interface DateTimeFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type:
    'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'color';
  readonly props?: {
    /** In the input's own format, such as `2026-01-01` for a date. */
    readonly min?: string;
    readonly max?: string;
    readonly step?: number;
    readonly autoComplete?: string;
  };
}

/**
 * A file chooser. The value is a `File` (or a list of them when `multiple`);
 * nothing chosen is `undefined` (or an empty list). Pair it with `z.file()`.
 */
export interface FileFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'file';
  readonly props?: {
    /** The file types offered, as in the HTML `accept` attribute, such as `image/*`. */
    readonly accept?: string;
    readonly multiple?: boolean;
  };
}

export interface NumberFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  /** `range` is a slider over the same values. */
  readonly type: 'number' | 'range';
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
  | FileFieldConfig<TName>
  | DateTimeFieldConfig<TName>
  | NumberFieldConfig<TName>
  | SelectFieldConfig<TName>
  | ToggleFieldConfig<TName>
  | CustomFieldConfig<TName>;
