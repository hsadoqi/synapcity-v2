import type {
  EntityRef,
  PrototypeRecordKind,
  PrototypeRecordKindMap,
  PrototypeRecords,
} from '../../types';

export function emptyRecords(): PrototypeRecords {
  return {
    metric: {},
    goal: {},
    habit: {},
    project: {},
    task: {},
    event: {},
    activity: {},
    note: {},
    link: {},
    asset: {},
  };
}

export function getRecord<K extends PrototypeRecordKind>(
  records: PrototypeRecords,
  ref: EntityRef<K>,
): PrototypeRecordKindMap[K] | undefined {
  const table: Record<string, PrototypeRecordKindMap[K]> = records[ref.kind];
  return table[ref.id];
}

/** Immutable upsert of one record into its table. */
export function putRecord<K extends PrototypeRecordKind>(
  records: PrototypeRecords,
  kind: K,
  record: PrototypeRecordKindMap[K],
): PrototypeRecords {
  return { ...records, [kind]: { ...records[kind], [record.id]: record } };
}

export function removeRecord(
  records: PrototypeRecords,
  kind: PrototypeRecordKind,
  id: string,
): PrototypeRecords {
  if (!(id in records[kind])) return records;
  const { [id]: _removed, ...rest } = records[kind];
  void _removed;
  return { ...records, [kind]: rest };
}

/** The record with `updatedAt` moved to `now`. */
export function touchRecord<T extends { updatedAt: string }>(
  record: T,
  now: number,
): T {
  return { ...record, updatedAt: new Date(now).toISOString() };
}
