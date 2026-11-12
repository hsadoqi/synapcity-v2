export {
  DESCRIPTION_MAX,
  ICON_MAX,
  ICON_NAME_PATTERN,
  NAME_MAX,
  RECORD_MESSAGES,
  TAG_MAX,
  TAGS_MAX,
  type RecordMessage,
} from './limits';
export {
  RECORD_KINDS,
  isRecordKind,
  recordKindSchema,
  type RecordKind,
} from './kinds';
export { codePointLength, isStorableText } from './text';
export {
  baseRecordCreateSchema,
  baseRecordMetadataSchema,
  baseRecordPatchSchema,
  boundedDescriptionSchema,
  boundedIconSchema,
  boundedNameSchema,
  boundedTagsSchema,
  editableFieldsOf,
  noCaseInsensitiveDuplicates,
  recordPatchSchema,
  type BaseRecordCreate,
  type BaseRecordMetadata,
  type BaseRecordPatch,
  type BoundedDescription,
  type BoundedIcon,
  type BoundedName,
  type BoundedTags,
} from './metadata';
export { baseRecordSchema, type BaseRecord } from './base-record';
export { initialsOf } from './initials';
