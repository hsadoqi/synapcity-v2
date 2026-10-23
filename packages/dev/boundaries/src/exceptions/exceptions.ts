import type { Exception, Violation } from '../model/index.ts';

/**
 * Existing violations, one file or edge each, with the milestone that removes it
 * (workspace conventions, Boundary checks). An entry that stops matching fails the run.
 */
export const EXCEPTIONS: readonly Exception[] = [
  {
    rule: 'R11',
    file: 'packages/frontend/site/src/metadata.ts',
    specifier: 'next',
    reason:
      'Pre-existing Next.js Metadata type in the site package; it keeps its layout until a scoped change gives it a ./next entry.',
    removal: 'M6 frontend foundations',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/blocks/entity/entity-item-card/entity-item-card.tsx',
    specifier: 'next/link',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal: 'M7 collection migration (entity blocks join frontend-collection)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/blocks/entity/entity-section/entity-section.tsx',
    specifier: 'next/link',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal: 'M7 collection migration (entity blocks join frontend-collection)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/blocks/entity/recent-entity/recent-entity-items.tsx',
    specifier: 'next/link',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal: 'M7 collection migration (entity blocks join frontend-collection)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/blocks/entity/recent-entity/recent-entity-row.tsx',
    specifier: 'next/link',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal: 'M7 collection migration (entity blocks join frontend-collection)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/blocks/root-shell/root-header/root-header.tsx',
    specifier: 'next/link',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal: 'M6 shells migration (frontend-shells, host-supplied links)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/blocks/sidebar-shell/root-sidebar/root-sidebar.tsx',
    specifier: 'next/link',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal: 'M6 shells migration (frontend-shells, host-supplied links)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/components/auth-buttons/auth-buttons.tsx',
    specifier: 'next/navigation',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal: 'M9 auth migration (frontend-auth, host-supplied navigation)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/components/link-button/link-button.tsx',
    specifier: 'next/link',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal:
      'M6 frontend foundations (link wrapper moves behind frontend-ui ./next)',
  },
  {
    rule: 'R11',
    file: 'packages/frontend/ui/src/components/user-menu/user-menu.tsx',
    specifier: 'next/link',
    reason:
      'Pre-existing Next.js import in shared UI (ownership map: framework-coupled presentation).',
    removal: 'M6 shells migration (frontend-shells, host-supplied links)',
  },
  {
    rule: 'R9',
    file: 'apps/web/src/features/account/components/avatar/avatar-field/avatar-field.tsx',
    reason:
      "Pre-existing barrel-induced module cycle across the account components' index files.",
    removal: 'M9 account migration',
  },
  {
    rule: 'R9',
    file: 'apps/web/src/features/auth/client/index.ts',
    reason:
      'Pre-existing barrel-induced module cycle: the auth client barrel and the user provider import each other.',
    removal: 'M9 auth migration',
  },
  {
    rule: 'R9',
    file: 'apps/web/src/features/settings/components/account-settings/index.tsx',
    reason:
      "Pre-existing barrel-induced module cycle across the settings components' index files.",
    removal: 'M8 settings migration',
  },
  {
    rule: 'R9',
    file: 'packages/frontend/ui/src/blocks/entity/entity-section/entity-section.tsx',
    reason:
      'Pre-existing module cycle: entity-section imports its own parent barrel @synapcity/frontend-ui/blocks/entity.',
    removal: 'M7 collection migration',
  },
  {
    rule: 'R9',
    file: 'packages/frontend/ui/src/providers/mode-provider/index.ts',
    reason:
      'Pre-existing module cycle: mode-provider and utils/theme import each other.',
    removal: 'M8 preferences migration (frontend-preferences)',
  },
];

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
