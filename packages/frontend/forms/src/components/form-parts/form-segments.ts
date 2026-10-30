import { FieldGroup, FieldConfig } from '../../types';

export interface Segment {
  readonly group?: FieldGroup;
  readonly fields: FieldConfig[];
}

/**
 * The fields in order, with each group's adjacent run of fields gathered into
 * one segment (`defineForm` guarantees a group is one run). An ungrouped field
 * is a segment of its own.
 */
export function segmentsOf(
  fields: readonly FieldConfig[],
  groups: ReadonlyMap<string, FieldGroup>,
): Segment[] {
  const segments: Segment[] = [];
  for (const field of fields) {
    const last = segments[segments.length - 1];
    if (
      field.group !== undefined &&
      last?.group !== undefined &&
      last.group.id === field.group
    ) {
      last.fields.push(field);
      continue;
    }
    segments.push({
      group: field.group === undefined ? undefined : groups.get(field.group),
      fields: [field],
    });
  }
  return segments;
}
