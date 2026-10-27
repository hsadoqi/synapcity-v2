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
  createRecord,
  listRecordSummaries,
  setRecordPinned,
  type CreatedOutcome,
  type PinnedOutcome,
  type RecordKind,
} from './records';
