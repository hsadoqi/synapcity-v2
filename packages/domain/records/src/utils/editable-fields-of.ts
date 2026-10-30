/** The editable fields every record shares (`BaseRecordFields`). */
type EditableFields = {
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
export function editableFieldsOf(record: EditableFields): EditableFields {
  return {
    name: record.name,
    ...(record.description !== undefined && {
      description: record.description,
    }),
    icon: record.icon,
    tags: [...record.tags],
  };
}
