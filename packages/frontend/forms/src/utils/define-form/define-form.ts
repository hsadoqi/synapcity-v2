import type { z } from 'zod';

import type {
  DefineFormInput,
  FormDefinition,
  FormDefinitionIssue,
} from '../../types';
import { describeSchemaField } from '../describe-schema-field';

/** Names that collide with React Hook Form's internal error shapes. */
const RESERVED_NAMES: ReadonlySet<string> = new Set([
  'type',
  'root',
  'ref',
  'types',
  'message',
  'form',
]);

/** Thrown by `defineForm` with every problem it found. Messages carry names only. */
export class FormDefinitionError extends Error {
  readonly issues: readonly FormDefinitionIssue[];

  constructor(issues: readonly FormDefinitionIssue[]) {
    super(
      `Invalid form definition: ${issues.map((issue) => `${issue.code} "${issue.name}"`).join('; ')}`,
    );
    this.name = 'FormDefinitionError';
    this.issues = issues;
  }
}

/**
 * Checks a form definition when it is written, so a broken one fails in a test
 * or a build and never loops or misbehaves while rendering. Call it at module
 * scope.
 */
export function defineForm<TSchema extends z.ZodObject>(
  input: DefineFormInput<TSchema>,
): FormDefinition<TSchema> {
  const { schema, fields, groups = [], rules = [] } = input;
  const issues: FormDefinitionIssue[] = [];
  const shapeKeys = new Set(Object.keys(schema.shape));
  const names = new Set<string>();

  if ((schema.def.checks?.length ?? 0) > 0) {
    issues.push({ code: 'schema-has-refinements', name: '(schema)' });
  }

  const reportedDuplicates = new Set<string>();
  for (const field of fields) {
    if (names.has(field.name) && !reportedDuplicates.has(field.name)) {
      issues.push({ code: 'duplicate-name', name: field.name });
      reportedDuplicates.add(field.name);
    }
    names.add(field.name);
    if (!shapeKeys.has(field.name))
      issues.push({ code: 'unknown-field', name: field.name });
    if (RESERVED_NAMES.has(field.name))
      issues.push({ code: 'reserved-name', name: field.name });
  }

  const groupIds = new Set<string>();
  for (const group of groups) {
    if (groupIds.has(group.id))
      issues.push({ code: 'duplicate-name', name: group.id });
    groupIds.add(group.id);
  }
  const unknownGroups = new Set<string>();
  for (const field of fields) {
    if (
      field.group !== undefined &&
      !groupIds.has(field.group) &&
      !unknownGroups.has(field.group)
    ) {
      issues.push({ code: 'unknown-group', name: field.group });
      unknownGroups.add(field.group);
    }
  }

  // A group is a run of adjacent fields: once a run ends, its id may not return.
  const closedGroups = new Set<string>();
  const splitGroups = new Set<string>();
  let currentGroup: string | undefined;
  for (const field of fields) {
    if (field.group === currentGroup) continue;
    if (currentGroup !== undefined) closedGroups.add(currentGroup);
    if (
      field.group !== undefined &&
      closedGroups.has(field.group) &&
      !splitGroups.has(field.group)
    ) {
      issues.push({ code: 'split-group', name: field.group });
      splitGroups.add(field.group);
    }
    currentGroup = field.group;
  }

  const dependencies = new Map<string, readonly string[]>();
  for (const field of fields) {
    const referenced = (field.dependencies ?? []).flatMap((dependency) =>
      dependency.conditions.map((condition) => condition.field as string),
    );
    for (const reference of referenced) {
      if (!names.has(reference))
        issues.push({
          code: 'unknown-reference',
          name: field.name,
          path: [reference],
        });
    }
    if (!dependencies.has(field.name)) {
      dependencies.set(field.name, [
        ...new Set(referenced.filter((reference) => names.has(reference))),
      ]);
    }
  }
  for (const rule of rules) {
    for (const reference of [...rule.fields, rule.path]) {
      if (!names.has(reference))
        issues.push({
          code: 'unknown-reference',
          name: rule.path,
          path: [reference],
        });
    }
  }

  // Depth-first search: a post-order list puts every field after what it reads.
  const evaluationOrder: string[] = [];
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const visit = (name: string): void => {
    const status = state.get(name);
    if (status === 'done') return;
    if (status === 'visiting') {
      issues.push({
        code: 'cycle',
        name,
        path: [...stack.slice(stack.indexOf(name)), name],
      });
      return;
    }
    state.set(name, 'visiting');
    stack.push(name);
    for (const dependency of dependencies.get(name) ?? []) visit(dependency);
    stack.pop();
    state.set(name, 'done');
    evaluationOrder.push(name);
  };
  for (const name of dependencies.keys()) visit(name);

  if (issues.length > 0) throw new FormDefinitionError(issues);

  const baseRequired: Record<string, boolean> = {};
  for (const field of fields) {
    const { optional, nullable } = describeSchemaField(schema, field.name);
    baseRequired[field.name] = !(optional || nullable);
  }

  return { schema, rules, fields, groups, baseRequired, evaluationOrder };
}
