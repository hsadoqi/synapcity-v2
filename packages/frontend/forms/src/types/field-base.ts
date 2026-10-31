export type ConditionOperator =
  'equals' | 'notEquals' | 'contains' | 'gt' | 'lt' | 'isEmpty';

export type DependencyEffect =
  'show' | 'hide' | 'enable' | 'disable' | 'require';

export interface FieldBase<TName extends string> {
  readonly name: TName;
  readonly label: string;
  readonly description?: string;
  readonly group?: string;
  readonly dependencies?: readonly FieldDependency<TName>[];
  readonly asyncValidation?: AsyncFieldValidation;
}

/** What happens to a field while its conditions are met. */
export interface FieldDependency<TName extends string = string> {
  readonly conditions: readonly FieldCondition<TName>[];
  readonly match: 'all' | 'any';
  readonly effect: DependencyEffect;
}

/** What an async check is given besides the value. */
export interface AsyncFieldCheckContext {
  /** Aborted when the value changes, the field unmounts, or the check times out. */
  readonly signal: AbortSignal;
  /** The current values of the visible fields, for checks that read another field. */
  readonly values: Readonly<Record<string, unknown>>;
}

/**
 * A check that needs the network or another slow source, such as "is this
 * handle taken". It runs only once the field's own schema accepts the value
 * and the value is not empty. Results for a value are remembered, and the same
 * value in flight is checked once. While typing it runs in the background and
 * the field stays editable (unless `disableWhileValidating`); on submit, a form
 * with async fields locks until every check, and the handler, have finished.
 */
export interface AsyncFieldValidation {
  /** Resolves to an error message, or `undefined` when the value is accepted. */
  check(
    value: unknown,
    context: AsyncFieldCheckContext,
  ): Promise<string | undefined>;
  /** Quiet time after the last change before the check starts. Defaults to 400. */
  readonly debounceMs?: number;
  /** A check that takes longer fails with `messages.failed`. Defaults to 8000. */
  readonly timeoutMs?: number;
  /**
   * How long a refusal is remembered for the same value. A taken handle can
   * become free, so a refusal expires; `0` never remembers one. Accepted values
   * are remembered until the cache is full. Defaults to 30000.
   */
  readonly refusalTtlMs?: number;
  /**
   * Disable the control while a check runs, including while typing. Off by
   * default, so a pause in typing never takes the field away; the submit-time
   * lock is separate and always applies to a form with async fields.
   */
  readonly disableWhileValidating?: boolean;
  readonly messages?: {
    /** Announced while the check runs. Defaults to `Validating…`. */
    readonly validating?: string;
    /** Shown when the check throws or times out. Never the thrown error's text. */
    readonly failed?: string;
  };
}

/** A test on the current value of another field of the same form. */
export interface FieldCondition<TName extends string = string> {
  readonly field: TName;
  readonly operator: ConditionOperator;
  readonly value?: unknown;
}

/** One choice of a select field. */
export interface FieldOption {
  readonly value: string;
  readonly label: string;
  /**
   * A heading to list the option under. Options are gathered by group, groups
   * in order of first appearance. In a windowed list the heading is shown but
   * not announced as a group.
   */
  readonly group?: string;
}
