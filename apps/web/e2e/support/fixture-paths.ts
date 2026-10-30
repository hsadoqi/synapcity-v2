/*
 * Where the development fixture identity's pages are, for the tests that run
 * against it (`SYNAPCITY_DEV_AUTH=fixture`). The user id is the app's
 * `FIXTURE_USER_ID` (`src/lib/access/dev-fixture.ts`) and the record ids are
 * the ones in `src/features/<name>/lib/fixtures`; Playwright does not load the app's
 * workspace packages, so they are written here once instead of imported.
 */
const FIXTURE_USER_ID = 'fixture-user';

export const FIXTURE_HOME = `/${FIXTURE_USER_ID}/home`;
export const FIXTURE_DOCUMENTS = `${FIXTURE_HOME}/documents`;
const FIXTURE_DASHBOARDS = `${FIXTURE_HOME}/dashboards`;
const FIXTURE_SPACES = `${FIXTURE_HOME}/spaces`;

export const FIXTURE_DOCUMENT_LAUNCH_PLAN = `${FIXTURE_DOCUMENTS}/fixture-document-launch-plan`;
export const FIXTURE_DOCUMENT_LONG_READING = `${FIXTURE_DOCUMENTS}/fixture-document-long-reading`;
export const FIXTURE_DASHBOARD_PROJECT_STATUS = `${FIXTURE_DASHBOARDS}/fixture-dashboard-project-status`;
export const FIXTURE_DASHBOARD_READING_PROGRESS = `${FIXTURE_DASHBOARDS}/fixture-dashboard-reading-progress`;
export const FIXTURE_SPACE_WRITING = `${FIXTURE_SPACES}/fixture-space-writing`;

/** The text with every regular-expression character made literal. */
export const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
