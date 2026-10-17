/**
 * Short confirmations that have to survive a redirect, such as "Password
 * updated." after a reset sends someone to their home page.
 *
 * The URL carries only a key (`?notice=password-updated`). The wording lives
 * here, so a crafted link can make the app show one of these messages and
 * nothing else; an unknown key is ignored. Display only: nothing is authorized
 * by it.
 */
export const NOTICES = {
  'password-updated': 'Password updated.',
  'email-updated': 'Email address updated.',
  'account-connected': 'Account connected.',
  // The first of two confirmations (see "Secure email change").
  'email-change-step':
    'Link confirmed. Confirm the message sent to your other address to finish the change.',
} as const;

export type NoticeKey = keyof typeof NOTICES;

/** The query parameter that carries the key. */
export const NOTICE_PARAM = 'notice';

/** `hasOwn`, so inherited names such as `constructor` are not keys. */
export function isNoticeKey(
  value: string | null | undefined,
): value is NoticeKey {
  return typeof value === 'string' && Object.hasOwn(NOTICES, value);
}

const PLACEHOLDER_ORIGIN = 'http://placeholder.invalid';

/**
 * A same-origin path with the notice added, keeping any query and fragment it
 * already has. Pass a path this app built, not untrusted input.
 */
export function withNotice(path: string, key: NoticeKey): string {
  const url = new URL(path, PLACEHOLDER_ORIGIN);
  url.searchParams.set(NOTICE_PARAM, key);
  return `${url.pathname}${url.search}${url.hash}`;
}
