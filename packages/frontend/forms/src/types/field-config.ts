import { FieldBase, FieldOption } from './field-renderer';

export type ConditionOperator =
  'equals' | 'notEquals' | 'contains' | 'gt' | 'lt' | 'isEmpty';

export type DependencyEffect =
  'show' | 'hide' | 'enable' | 'disable' | 'require';

/**
 * Opt-in windowing for a long option list: only the rows in view are
 * rendered. `true` windows any list; `{ threshold }` windows only lists longer
 * than the threshold.
 */
export type VirtualizeOption = boolean | { readonly threshold: number };

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
    /**
     * The browser's `pattern`, for the keyboard hint and assistive tech; the
     * schema decides. `defineForm` rejects a pattern that is not one of the
     * schema's own `regex` checks (an optional `^` and `$` aside).
     */
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
 * A date, time, month, week or colour picker. The value is the normalized
 * string the control gives (`2026-05-04`, `09:30`, or `#rrggbb` for a colour);
 * nothing chosen is `''`. Date fields use the calendar-backed date picker;
 * the remaining types use native inputs.
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
  readonly props?: {
    readonly placeholder?: string;
    /** Offer a control that empties the choice (the value becomes `undefined`). */
    readonly clearable?: boolean;
    /** Type to filter the options. */
    readonly searchable?: boolean;
    /**
     * Window the option list. A select that sets this is searchable too: a
     * long list needs filtering, and the plain select cannot be windowed.
     */
    readonly virtualize?: VirtualizeOption;
  };
}

/**
 * Several values chosen from declared options, shown as removable chips with a
 * filter input. The value is a list of option values in the order chosen;
 * nothing chosen is `[]`. Pair it with `z.array(z.enum([...]))`.
 */
export interface MultiSelectFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'multiselect';
  readonly options: readonly FieldOption[];
  readonly props?: {
    readonly placeholder?: string;
    /** Offer a control that removes every chosen value. */
    readonly clearable?: boolean;
    /** Stop offering options once this many are chosen. */
    readonly maxSelected?: number;
    readonly virtualize?: VirtualizeOption;
  };
}

/**
 * Free text entered as a list of tags: Enter or a comma adds one, Backspace in
 * the empty input removes the last. Values are trimmed; empty text is never a
 * tag. The value is the list of tags; nothing entered is `[]`. Pair it with
 * `z.array(z.string())`.
 */
export interface TagsFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'tags';
  readonly props?: {
    readonly placeholder?: string;
    readonly maxTags?: number;
    /** The longest tag accepted; longer text is not added. */
    readonly maxLength?: number;
    /** Keep a tag that repeats an existing one (compared case-insensitively). Defaults to `false`. */
    readonly allowDuplicates?: boolean;
  };
}

/**
 * A start and end day. The value is `{ from, to }` as local `yyyy-MM-dd`
 * strings, with `to` absent while only the start is picked; nothing chosen is
 * `undefined`. Posted to a server action as `<name>.from` and `<name>.to`.
 */
export interface DateRangeFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'date-range';
  readonly props?: {
    readonly min?: string;
    readonly max?: string;
    readonly numberOfMonths?: number;
  };
}

export interface RadioFieldConfig<
  TName extends string = string,
> extends FieldBase<TName> {
  readonly type: 'radio';
  readonly options: readonly FieldOption[];
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
  | MultiSelectFieldConfig<TName>
  | TagsFieldConfig<TName>
  | DateRangeFieldConfig<TName>
  | RadioFieldConfig<TName>
  | ToggleFieldConfig<TName>
  | CustomFieldConfig<TName>;
