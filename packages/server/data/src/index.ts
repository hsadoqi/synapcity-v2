import 'server-only';

export {
  addSpaceDashboard,
  addSpaceDocument,
  findSpace,
  getSpaceRelations,
  listLatestSpaces,
  listSpaceDashboards,
  listSpaceDocuments,
  listSpaceNavItems,
  listSpaces,
  listSpacesWithRelations,
  listSpaceSummaries,
  recordSpaceView,
  setSpacePinned,
  type AddedOutcome,
  type SpaceDashboardLink,
  type SpaceDocumentLink,
  type SpaceNavItem,
  type SpaceRelationsResult,
  type SpaceRelationType,
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
  listLatestRecords,
  listRecordSummaries,
  recordRecordView,
  setRecordPinned,
  type CreatedOutcome,
  type ParticipantTable,
  type PinnedOutcome,
  type RecordTable,
  type RecordSummary,
  RECORD_TABLES,
} from './records';
