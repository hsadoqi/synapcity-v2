import type {
  DependencyEffect,
  FieldCondition,
  FieldDependency,
  FieldState,
  FormDefinition,
} from '../../../types';
import { isEmptyValue } from '../../../utils/is-empty-value';

type Read = (name: string) => unknown;

/** A number, or NaN: numbers and non-blank numeric strings only. */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

function holds(condition: FieldCondition, read: Read): boolean {
  const value = read(condition.field);
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'notEquals':
      return value !== condition.value;
    case 'contains':
      if (typeof value === 'string') {
        return (
          typeof condition.value === 'string' && value.includes(condition.value)
        );
      }
      return Array.isArray(value) && value.includes(condition.value);
    case 'gt':
      return toNumber(value) > toNumber(condition.value);
    case 'lt':
      return toNumber(value) < toNumber(condition.value);
    case 'isEmpty':
      return isEmptyValue(value);
  }
}

function isMet(dependency: FieldDependency, read: Read): boolean {
  const test = (condition: FieldCondition) => holds(condition, read);
  return dependency.match === 'all'
    ? dependency.conditions.every(test)
    : dependency.conditions.some(test);
}

/**
 * Works out whether each field is visible, enabled and required for the given
 * values. A field is visible unless a `hide` dependency is met or a `show`
 * dependency is not (every `show` dependency must be met); `enable` and
 * `disable` work the same way for `enabled`. A field is required when its
 * schema key accepts neither `undefined` nor `null`, or any `require`
 * dependency is met. A hidden field reads as empty to the fields that depend on
 * it, so a stale value cannot keep another field showing. Fields are evaluated
 * in `evaluationOrder`, so everything a field reads is settled first.
 */
export function resolveFieldStates(
  definition: FormDefinition,
  values: Readonly<Record<string, unknown>>,
): Readonly<Record<string, FieldState>> {
  const fieldByName = new Map(
    definition.fields.map((field) => [field.name as string, field]),
  );
  const effective: Record<string, unknown> = {};
  const read: Read = (name) => effective[name];
  const result: Record<string, FieldState> = {};

  for (const name of definition.evaluationOrder) {
    const field = fieldByName.get(name);
    if (field === undefined) continue;
    const dependencies = field.dependencies ?? [];
    const met = (effect: DependencyEffect): boolean[] =>
      dependencies
        .filter((dependency) => dependency.effect === effect)
        .map((dependency) => isMet(dependency, read));

    const visible = met('show').every(Boolean) && !met('hide').some(Boolean);
    const enabled =
      met('enable').every(Boolean) && !met('disable').some(Boolean);
    const required =
      definition.baseRequired[name] === true || met('require').some(Boolean);

    result[name] = { visible, enabled, required };
    effective[name] = visible ? values[name] : undefined;
  }
  return result;
}
