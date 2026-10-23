/**
 * Paths under a signed-in user's own `/<userId>/...` area. `userId` is the
 * Supabase user id (the JWT `sub`). Encoded so it always stays a single path
 * segment, including dots, which `encodeURIComponent` leaves alone but URL
 * resolution would collapse (`/../home` becomes `/home`).
 */
function userPath(userId: string, page: 'home' | 'settings'): string {
  const segment = encodeURIComponent(userId).replace(/\./g, '%2E');
  return `/${segment}/${page}`;
}

/** Where a signed-in user lands by default. */
export function homePathFor(userId: string): string {
  return userPath(userId, 'home');
}

export function spacesPathFor(userId: string): string {
  return `${homePathFor(userId)}/spaces`;
}

export function settingsPathFor(userId: string): string {
  return userPath(userId, 'settings');
}

/** The account links the shared shell and menu are given, from one id. */
export function accountLinksFor(userId: string) {
  return {
    homeHref: homePathFor(userId),
    settingsHref: settingsPathFor(userId),
  };
}
