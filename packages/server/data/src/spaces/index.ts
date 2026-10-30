export {
  addSpaceDashboard,
  addSpaceDocument,
  listSpaceDashboards,
  listSpaceDocuments,
  type AddedOutcome,
} from './space-participation';
export {
  findSpace,
  getSpaceRelations,
  listSpaceNavItems,
  listSpaces,
  listSpacesWithRelations,
  listSpaceSummaries,
  type SpaceDashboardLink,
  type SpaceDocumentLink,
  type SpaceNavItem,
  type SpaceRelationsResult,
  type SpaceRelationType,
} from './space-queries';
export { recordSpaceView, setSpacePinned } from './space-writes';
