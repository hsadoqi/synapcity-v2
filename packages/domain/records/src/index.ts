export {
  baseRecordCreateSchema,
  baseRecordMetadataSchema,
  baseRecordPatchSchema,
  baseRecordSchema,
  boundedDescriptionSchema,
  boundedIconSchema,
  boundedNameSchema,
  boundedTagsSchema,
  recordPatchSchema,
} from './schemas';
export type {
  BaseRecord,
  BaseRecordCreate,
  BaseRecordMetadata,
  BaseRecordPatch,
  BoundedDescription,
  BoundedIcon,
  BoundedName,
  BoundedTags,
} from './types';
export {
  DESCRIPTION_MAX,
  ICON_MAX,
  ICON_NAME_PATTERN,
  NAME_MAX,
  RECORD_MESSAGES,
  TAG_MAX,
  TAGS_MAX,
} from './constants';
export type { RecordMessage } from './constants';
export {
  codePointLength,
  editableFieldsOf,
  isStorableText,
  noCaseInsensitiveDuplicates,
} from './utils';
