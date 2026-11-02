import { demoCompositions } from './demo-sql';
import { demoWorkbench } from './demo-workbench';

/*
 * The "demo-workbench" scenario that `pnpm db:seed-demo` loads into the local
 * database, shaped for a workbench preview: workspaces with the resources
 * filed in them (what a sidebar lists), and the content a resource view would
 * show for one. Structural types, because this package must not import
 * frontend code. Document text is sample text, not stored anywhere.
 */

export type DemoResource = {
  id: string;
  kind: 'document' | 'dashboard';
  name: string;
  icon: string;
  pinned: boolean;
  /** How many other workspaces hold this same record. */
  alsoIn: number;
};

export type DemoWorkspace = {
  id: string;
  name: string;
  initials: string;
  icon: string;
  resources: DemoResource[];
};

export type DemoContent = {
  name: string;
  tags: string[];
  /** Names of the other workspaces that hold this record. */
  alsoIn: string[];
  paragraphs?: string[];
  widgets?: { id: string; title: string; type: string }[];
};

const SENTENCES = [
  'The first pass is about getting the shape right before polishing any single line.',
  'Everything below is a working note and will change once the next round of feedback lands.',
  'A good test of the idea is whether someone new can restate it after reading it once.',
  'Open questions are collected at the end so they do not interrupt the argument.',
  'Where the evidence is thin, the section says so instead of smoothing it over.',
  'The numbers here come from last week and should be refreshed before they are quoted.',
  'Most of the effort went into cutting, and the shorter version reads better.',
  'Decisions are listed with the reason beside them, so they can be revisited later.',
  'Nothing in this section depends on tools that are not already in use.',
  'The next step is small enough to finish in one sitting, which is the point.',
  'A few examples follow, ordered from the clearest to the most awkward.',
];

function hashOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (Math.imul(h, 31) + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function paragraphsFor(id: string): string[] {
  const seed = hashOf(id);
  return Array.from({ length: 3 + (seed % 3) }, (_, p) =>
    [0, 1, 2]
      .map((s) => SENTENCES[(seed + p * 5 + s * 3) % SENTENCES.length])
      .join(' '),
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function build() {
  const scenario = demoWorkbench();
  const compositions = demoCompositions(scenario);
  const records = new Map(
    [
      ...scenario.documents.map((r) => ({ ...r, kind: 'document' as const })),
      ...scenario.dashboards.map((r) => ({ ...r, kind: 'dashboard' as const })),
    ].map((r) => [r.id, r]),
  );
  const spaceName = new Map(scenario.spaces.map((s) => [s.id, s.name]));
  const filedIn = new Map<string, string[]>();
  for (const m of scenario.memberships) {
    filedIn.set(m.itemId, [...(filedIn.get(m.itemId) ?? []), m.spaceId]);
  }

  const workspaces: DemoWorkspace[] = scenario.spaces.map((space) => ({
    id: space.id,
    name: space.name,
    initials: initialsOf(space.name),
    icon: space.icon,
    resources: scenario.memberships
      .filter((m) => m.spaceId === space.id)
      .map((m) => records.get(m.itemId)!)
      // Pinned first, then most recently updated.
      .sort(
        (a, b) =>
          Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt)) ||
          b.updatedAt.localeCompare(a.updatedAt),
      )
      .map((r) => ({
        id: r.id,
        kind: r.kind,
        name: r.name,
        icon: r.icon,
        pinned: Boolean(r.pinnedAt),
        alsoIn: (filedIn.get(r.id)?.length ?? 1) - 1,
      })),
  }));

  const content = (id: string): DemoContent => {
    const record = records.get(id);
    if (!record) throw new Error(`The demo data has no resource "${id}".`);
    const composition = compositions[id];
    return {
      name: record.name,
      tags: record.tags,
      alsoIn: (filedIn.get(id) ?? []).map((s) => spaceName.get(s)!),
      ...(record.kind === 'document'
        ? { paragraphs: paragraphsFor(id) }
        : {
            widgets: (composition?.widgets ?? []).map((w) => ({
              id: w.id,
              title: w.title,
              type: w.type,
            })),
          }),
    };
  };

  return { workspaces, content };
}

const built = build();

/** Fresh copies each call, so a story can never change another's data. */
export function demoWorkspaces(): DemoWorkspace[] {
  return structuredClone(built.workspaces);
}

/** What a resource view shows for one resource. */
export function demoContent(resourceId: string): DemoContent {
  return structuredClone(built.content(resourceId));
}

export function demoWorkspaceId(
  workspaces: readonly DemoWorkspace[],
  name: string,
): string {
  const found = workspaces.find((w) => w.name === name);
  if (!found) throw new Error(`The demo data has no workspace "${name}".`);
  return found.id;
}

export function demoResourceId(
  workspaces: readonly DemoWorkspace[],
  name: string,
): string {
  for (const w of workspaces) {
    const found = w.resources.find((r) => r.name === name);
    if (found) return found.id;
  }
  throw new Error(`The demo data has no resource "${name}".`);
}
