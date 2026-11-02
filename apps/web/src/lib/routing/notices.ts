/**
 * Short confirmations that have to survive a redirect, such as "Password
 * updated." after a reset sends someone to their home page.
 *
 * The URL carries only a key (`?notice=password-updated`). Everything shown —
 * the wording, the kind of toast, how long it stays and any action — lives
 * here, so a crafted link can make the app show one of these notices exactly as
 * written and nothing else; an unknown key is ignored. Display only: nothing is
 * authorized by it.
 */

import { PLACEHOLDER_ORIGIN } from './placeholder-origin';

/** The kinds of notice, matching the toast types the UI package styles. */
export type NoticeType = 'success' | 'info' | 'warning' | 'error';

/**
 * A link the toast offers, such as "View settings". A same-origin path written
 * here, never taken from the URL.
 *
 * There is deliberately no "Undo": a notice reports something the server had
 * already finished before the page loaded, so undoing it needs its own
 * operation. An in-app toast that can undo passes `actionProps.onClick` to
 * `toast.add` directly.
 */
export interface NoticeAction {
  label: string;
  href: `/${string}`;
}

export interface Notice {
  type: NoticeType;
  /** One short sentence: what happened. */
  title: string;
  /** Optional second line: what it means, or what to do next. */
  description?: string;
  /** Milliseconds before it closes; `0` keeps it until dismissed. Defaults by type. */
  timeout?: number;
  action?: NoticeAction;
}

/**
 * How long each kind stays when a notice does not say. An error stays until it
 * is dismissed, so it cannot disappear before it is read (WCAG 2.2.1); the
 * others leave more time the more there is to take in. Hovering or focusing a
 * toast pauses it.
 */
export const NOTICE_TIMEOUTS: Readonly<Record<NoticeType, number>> = {
  success: 5000,
  info: 8000,
  warning: 10000,
  error: 0,
};

const DEFINITIONS = {
  'password-updated': { type: 'success', title: 'Password updated.' },
  'email-updated': { type: 'success', title: 'Email address updated.' },
  'account-connected': { type: 'success', title: 'Account connected.' },
  'account-deleted': {
    type: 'success',
    title: 'Your account has been deleted.',
    description: 'You have been signed out everywhere.',
  },
  // The first of two confirmations (see "Secure email change"): nothing has
  // changed yet, so it is information, not success.
  'email-change-step': {
    type: 'info',
    title: 'Link confirmed.',
    description:
      'Confirm the message sent to your other address to finish the change.',
    timeout: 12000,
  },
} as const satisfies Record<string, Notice>;

export type NoticeKey = keyof typeof DEFINITIONS;

export const NOTICES: Readonly<Record<NoticeKey, Notice>> = DEFINITIONS;

/** The query parameter that carries the key. */
export const NOTICE_PARAM = 'notice';

/** `hasOwn`, so inherited names such as `constructor` are not keys. */
export function isNoticeKey(
  value: string | null | undefined,
): value is NoticeKey {
  return typeof value === 'string' && Object.hasOwn(NOTICES, value);
}

/** How long a notice stays: its own timeout, or its type's default. */
export function noticeTimeout(notice: Notice): number {
  return notice.timeout ?? NOTICE_TIMEOUTS[notice.type];
}

/**
 * A same-origin path with the notice added, keeping any query and fragment it
 * already has. Pass a path this app built, not untrusted input.
 */
export function withNotice(path: string, key: NoticeKey): string {
  const url = new URL(path, PLACEHOLDER_ORIGIN);
  url.searchParams.set(NOTICE_PARAM, key);
  return `${url.pathname}${url.search}${url.hash}`;
}
