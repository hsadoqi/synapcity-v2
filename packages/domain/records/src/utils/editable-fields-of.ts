// Structural, not `BaseRecordMetadata` from `../types`: the types import the
// schemas, which import these utils, and that would be a module cycle.
type BaseRecordMetadata = {
  name: string;
  description?: string;
  icon: string;
  tags: string[];
};

/**
 * The editable fields of a saved record, and nothing else: what an edit form
 * starts from. The write schemas are strict and refuse server-managed fields,
 * so a caller that holds a saved record projects it here instead of relying
 * on a schema to drop keys.
 */
export function editableFieldsOf(
  record: BaseRecordMetadata,
): BaseRecordMetadata {
  return {
    name: record.name,
    ...(record.description !== undefined && {
      description: record.description,
    }),
    icon: record.icon,
    tags: [...record.tags],
  };
}
