import type { Exception, Violation } from '../model/index.ts';

/**
 * Existing violations, one file or edge each, with the milestone that removes it
 * (workspace conventions, Boundary checks). An entry that stops matching fails the run.
 */
export const EXCEPTIONS: readonly Exception[] = [];

const matches = (exception: Exception, violation: Violation) =>
  exception.rule === violation.rule &&
  exception.file === violation.file &&
  (exception.specifier === undefined ||
    exception.specifier === violation.specifier);

export function applyExceptions(
  violations: Violation[],
  exceptions: readonly Exception[],
): { remaining: Violation[]; stale: Exception[] } {
  return {
    remaining: violations.filter(
      (violation) =>
        !exceptions.some((exception) => matches(exception, violation)),
    ),
    stale: exceptions.filter(
      (exception) =>
        !violations.some((violation) => matches(exception, violation)),
    ),
  };
}
