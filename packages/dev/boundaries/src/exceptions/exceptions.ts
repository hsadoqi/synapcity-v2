import type { Exception, Violation } from '../model/index.ts';

/**
 * Existing violations, one file or edge each, with the milestone that removes it
 * (workspace conventions, Boundary checks). An entry that stops matching fails the run.
 */
const NEXT_IN_SHARED_UI =
  'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).';

export const EXCEPTIONS: readonly Exception[] = [
  {
    rule: 'R11',
    file: 'packages/frontend/site/src/metadata.ts',
    specifier: 'next',
    reason:
      'Pre-existing Next.js Metadata type in the site package; it keeps its layout until a scoped change gives it a ./next entry.',
    removal: 'M5 Spaces slice if it needs the site package, else M10 sweep',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/blocks/root-shell/root-header/root-header.tsx',
    specifier: 'next/link',
    reason: NEXT_IN_SHARED_UI,
    removal:
      'M5 Spaces slice or the later slice that needs this shell (frontend-shells, host-supplied links)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/blocks/sidebar-shell/root-sidebar/root-sidebar.tsx',
    specifier: 'next/link',
    reason: NEXT_IN_SHARED_UI,
    removal:
      'M5 Spaces slice or the later slice that needs this shell (frontend-shells, host-supplied links)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/components/auth-buttons/auth-buttons.tsx',
    specifier: 'next/navigation',
    reason: NEXT_IN_SHARED_UI,
    removal: 'M7 auth migration (frontend-auth, host-supplied navigation)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/components/user-menu/user-menu.tsx',
    specifier: 'next/link',
    reason: NEXT_IN_SHARED_UI,
    removal:
      'M5 Spaces slice or the later slice that needs this shell (frontend-shells, host-supplied links)',
  },
  {
    rule: 'R9',
    file: 'apps/web/src/features/account/components/avatar/avatar-field/avatar-field.tsx',
    members: [
      'apps/web/src/features/account/components/avatar/avatar-field/avatar-field.tsx',
      'apps/web/src/features/account/components/avatar/avatar-field/index.ts',
      'apps/web/src/features/account/components/avatar/avatar-form/avatar-form.tsx',
      'apps/web/src/features/account/components/avatar/avatar-form/index.ts',
      'apps/web/src/features/account/components/avatar/index.ts',
      'apps/web/src/features/account/components/name/index.ts',
      'apps/web/src/features/account/components/name/name-field/index.ts',
      'apps/web/src/features/account/components/name/name-field/name-field.tsx',
      'apps/web/src/features/account/components/name/name-form/index.ts',
      'apps/web/src/features/account/components/name/name-form/name-form.tsx',
      'apps/web/src/features/account/components/profile/index.ts',
      'apps/web/src/features/account/components/profile/profile-setup-form/index.ts',
      'apps/web/src/features/account/components/profile/profile-setup-form/profile-setup-form.tsx',
      'apps/web/src/features/account/components/profile/profile-summary/index.ts',
      'apps/web/src/features/account/components/profile/profile-summary/profile-summary.tsx',
    ],
    reason:
      "Pre-existing barrel-induced module cycle across the account components' index files.",
    removal: 'M7 account migration',
  },
];

const sameMembers = (a: string[] | undefined, b: string[] | undefined) =>
  a === undefined ||
  (b !== undefined && a.length === b.length && a.every((m, i) => m === b[i]));

const matches = (exception: Exception, violation: Violation) =>
  exception.rule === violation.rule &&
  exception.file === violation.file &&
  (exception.specifier === undefined ||
    exception.specifier === violation.specifier) &&
  sameMembers(exception.members, violation.members);

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
