import type { FieldOption } from '../../types';

export interface GroupedOptions {
  /**
   * The options gathered by group: each group's options together, groups in
   * order of first appearance, options within a group in declared order.
   * Options with no group form one run of their own, where the first of them
   * appeared. Keyboard order and visual order are then the same.
   */
  readonly ordered: readonly FieldOption[];
  /** The group label of an option value, if it has one. */
  readonly groupOf: (value: string) => string | undefined;
  /** Whether any option names a group. */
  readonly grouped: boolean;
}

/** Gathers options by their `group`. See {@link GroupedOptions.ordered}. */
export function groupOptions(options: readonly FieldOption[]): GroupedOptions {
  const runs = new Map<string, FieldOption[]>();
  const groups = new Map<string, string | undefined>();
  for (const option of options) {
    // `\u0000` cannot collide with a label a person typed.
    const key = option.group === undefined ? '\u0000' : `g:${option.group}`;
    let run = runs.get(key);
    if (run === undefined) {
      run = [];
      runs.set(key, run);
    }
    run.push(option);
    groups.set(option.value, option.group);
  }
  return {
    ordered: [...runs.values()].flat(),
    groupOf: (value) => groups.get(value),
    grouped: options.some((option) => option.group !== undefined),
  };
}
