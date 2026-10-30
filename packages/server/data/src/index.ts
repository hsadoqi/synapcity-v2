import 'server-only';

export {
  findSpace,
  listSpaceDashboards,
  listSpaceDocuments,
  listSpaces,
  listSpaceSummaries,
  recordSpaceView,
  setSpacePinned,
} from './spaces';
export {
  COMPOSITION_SCHEMA_VERSION,
  loadComposition,
  saveComposition,
  type SaveCompositionOutcome,
  type StoredComposition,
} from './dashboards';
export {
  createRecord,
  findRecord,
  listRecordSummaries,
  recordRecordView,
  setRecordPinned,
  type CreatedOutcome,
  type ParticipantTable,
  type PinnedOutcome,
  type RecordTable,
  type RecordKind,
  type RecordSummary,
  RECORD_TABLES,
} from './records';
