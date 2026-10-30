export {
  baseRecordCreateSchema,
  baseRecordFieldsSchema,
  baseRecordInputSchema,
  baseRecordPatchSchema,
  baseRecordSchema,
  boundedIconSchema,
  boundedNameSchema,
  recordIdSchema,
  recordKindSchema,
  recordPatchSchema,
} from './schemas';
export type {
  BaseRecord,
  BaseRecordCreate,
  BaseRecordFields,
  BaseRecordInput,
  BaseRecordPatch,
  BoundedIcon,
  BoundedName,
  OwnedRecordSummary,
  RecordKind,
} from './types';
export {
  DESCRIPTION_MAX,
  ICON_MAX,
  ICON_NAME_PATTERN,
  NAME_MAX,
  RECORD_KINDS,
  RECORD_MESSAGES,
  TAG_MAX,
  TAGS_MAX,
} from './constants';
export type { RecordMessage } from './constants';
export {
  codePointLength,
  editableFieldsOf,
  isRecordKind,
  isStorableText,
  noCaseInsensitiveDuplicates,
} from './utils';
