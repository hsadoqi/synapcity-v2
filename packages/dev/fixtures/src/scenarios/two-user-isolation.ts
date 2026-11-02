import { item, membership, person, space, type Scenario } from './scenario';
import { starterFor } from './starter';

/**
 * The starter set for two people, plus near-collisions between them: the same
 * names (as in the starter), a name differing only in case, the same name used
 * by a Document for one and a Dashboard for the other, identical tags, and
 * records created at the same minute. No edge ever crosses between them. A
 * test or a manual check that A cannot see, change or file anything of B's
 * (and the reverse) has the most confusable data to fail on.
 */
export function twoUserIsolation(): Scenario {
  const name = 'two-user-isolation';
  const [a, b] = [
    person(name, 'a', 'Ada Example'),
    person(name, 'b', 'Grace Example'),
  ] as const;
  const partsA = starterFor(name, a);
  const partsB = starterFor(name, b);

  // B's Space differs from A's "Personal" only in case.
  const lower = space({
    scenario: name,
    owner: b,
    key: 'personal-lower',
    name: 'personal',
    icon: 'house',
    minute: 3,
  });
  // A's Dashboard is named like B's Document, and the reverse.
  const aDashboardLikeBDoc = item({
    scenario: name,
    owner: a,
    kind: 'dashboard',
    key: 'reading-notes-dash',
    name: 'Reading notes',
    icon: 'layout-dashboard',
    tags: ['learning'],
    minute: 22,
  });
  const bDocLikeADash = item({
    scenario: name,
    owner: b,
    kind: 'document',
    key: 'writing-progress-doc',
    name: 'Writing progress',
    icon: 'file-text',
    tags: ['writing'],
    minute: 14,
  });

  const learningA = partsA.spaces.find((s) => s.name === 'Learning')!;
  const writingB = partsB.spaces.find((s) => s.name === 'Writing')!;

  return {
    name,
    users: [a, b],
    spaces: [...partsA.spaces, ...partsB.spaces, lower],
    documents: [...partsA.documents, ...partsB.documents, bDocLikeADash],
    dashboards: [
      ...partsA.dashboards,
      ...partsB.dashboards,
      aDashboardLikeBDoc,
    ],
    memberships: [
      ...partsA.memberships,
      ...partsB.memberships,
      membership(a, 'dashboard', learningA.id, aDashboardLikeBDoc.id),
      membership(b, 'document', writingB.id, bDocLikeADash.id),
    ],
  };
}
