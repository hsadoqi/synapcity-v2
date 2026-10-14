/**
 * Where a signed-in account's own pages live. The consuming app owns its
 * routes, so it supplies these; shared components never build them from an id.
 */
export type AccountLinks = {
  homeHref: string;
  settingsHref: string;
};
