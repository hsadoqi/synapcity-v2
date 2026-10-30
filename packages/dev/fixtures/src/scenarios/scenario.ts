import {
  baseRecordSchema,
  type BaseRecord,
  type RecordKind,
} from '@synapcity/domain-records';
import { spaceSchema, type SpaceEntity } from '@synapcity/domain-spaces';

/*
 * A scenario is a pure data graph: people, the records they own, and which
 * records are filed in which Spaces. Ids are stable (derived from names, never
 * random), so a scenario is the same on every run, in every package that loads
 * it, and a seeder can recognise its own earlier work.
 *
 * What a scenario never holds: Dashboard compositions, revisions, Document
 * content, activity events or profiles. The database creates those itself when
 * a Dashboard or Document is inserted (triggers), and a scenario that supplied
 * them would hide a missing trigger. A seeder inserts the people, Spaces,
 * Documents and Dashboards, and lets the database do the rest.
 */

export type ScenarioUser = { id: string; email: string; name: string };

/** The record kinds that take part in Spaces (ADR-0013): every kind but Space. */
type ParticipantKind = Exclude<RecordKind, 'space'>;

/** One record filed in a Space; both ends belong to `ownerId`. */
export type Membership = {
  ownerId: string;
  spaceId: string;
  itemId: string;
  kind: ParticipantKind;
};

export type Scenario = {
  name: string;
  users: ScenarioUser[];
  spaces: SpaceEntity[];
  documents: BaseRecord[];
  dashboards: BaseRecord[];
  memberships: Membership[];
};

/** 128 bits from a string (cyrb128), as four 32-bit words. Deterministic, not secret. */
function hash128(text: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < text.length; i += 1) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

/** A UUID-shaped id (version 4, RFC 4122 variant) that depends only on `label`. */
export function stableId(label: string): string {
  const hex = hash128(label)
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
  const variant = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

type RecordInput = {
  scenario: string;
  owner: ScenarioUser;
  kind: RecordKind;
  key: string;
  name: string;
  description?: string;
  icon: string;
  tags?: string[];
  /** Minutes after the scenario's reference time; keeps `createdAt` ordered. */
  minute: number;
};

const REFERENCE_MS = Date.parse('2026-10-01T09:00:00.000Z');

function fields(input: RecordInput) {
  const created = new Date(REFERENCE_MS + input.minute * 60_000).toISOString();
  return {
    id: stableId(
      `${input.scenario}/${input.owner.email}/${input.kind}/${input.key}`,
    ),
    ownerId: input.owner.id,
    name: input.name,
    ...(input.description !== undefined && { description: input.description }),
    icon: input.icon,
    tags: input.tags ?? [],
    createdAt: created,
    updatedAt: created,
  };
}

/** A Space, checked against the Space contract. */
export function space(input: Omit<RecordInput, 'kind'>): SpaceEntity {
  return spaceSchema.parse(fields({ ...input, kind: 'space' }));
}

/** A Document or Dashboard base record, checked against the record contract. */
export function item(
  input: RecordInput & { kind: ParticipantKind },
): BaseRecord {
  return baseRecordSchema.parse(fields(input));
}

export function person(
  scenario: string,
  key: string,
  name: string,
): ScenarioUser {
  return {
    id: stableId(`${scenario}/user/${key}`),
    // The reserved .test domain: no scenario address can reach a real mailbox.
    email: `${scenario}-${key}@synapcity.test`,
    name,
  };
}

export function membership(
  owner: ScenarioUser,
  kind: ParticipantKind,
  spaceId: string,
  itemId: string,
): Membership {
  return { ownerId: owner.id, spaceId, itemId, kind };
}
