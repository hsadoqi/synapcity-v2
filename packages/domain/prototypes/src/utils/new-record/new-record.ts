import type { BaseRecord } from '@synapcity/domain-records';

import type { PrototypeRecordKind, RecordContext } from '../../types';
import { createId } from '../create-id';

const ID_PREFIX: Record<PrototypeRecordKind, string> = {
  metric: 'met',
  goal: 'gol',
  habit: 'hab',
  project: 'prj',
  task: 'tsk',
  event: 'evt',
  activity: 'act',
  note: 'nte',
  link: 'lnk',
  asset: 'ast',
};

/** Lucide icon a new record of each kind starts with. */
export const DEFAULT_ICONS: Record<PrototypeRecordKind, string> = {
  metric: 'gauge',
  goal: 'target',
  habit: 'repeat',
  project: 'folder-kanban',
  task: 'square-check',
  event: 'calendar',
  activity: 'activity',
  note: 'notebook-pen',
  link: 'link',
  asset: 'image',
};

/** The base record fields for a new record of `kind`: fresh id, owner, timestamps. */
export function newRecord(
  kind: PrototypeRecordKind,
  name: string,
  { ownerId, now }: RecordContext,
): BaseRecord {
  const at = new Date(now).toISOString();
  return {
    id: createId(ID_PREFIX[kind]),
    ownerId,
    name,
    icon: DEFAULT_ICONS[kind],
    tags: [],
    createdAt: at,
    updatedAt: at,
    pinnedAt: null,
    lastViewedAt: null,
  };
}
