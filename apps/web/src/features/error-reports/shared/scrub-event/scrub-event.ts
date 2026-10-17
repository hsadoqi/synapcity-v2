import type { ErrorEvent } from '@sentry/browser';

// Supabase user ids, which appear in routes such as /<userId>/settings. A
// route that puts any other identifier in the path (a username, a slug, an
// email) must be added here, or reports will carry it.
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ID_SEGMENT = new RegExp(`^${UUID}$`, 'i');
const ID_IN_TEXT = new RegExp(UUID, 'gi');
// A local part, then a domain of dot-separated labels, so a sentence's closing
// full stop is not taken as part of the address.
const EMAIL_IN_TEXT = /[^\s@<>()"',;:]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;

/**
 * Text with ids and email addresses replaced. Error messages can quote what
 * failed, and that can include either.
 */
export function scrubText(text: string): string {
  return text.replace(ID_IN_TEXT, ':id').replace(EMAIL_IN_TEXT, '[email]');
}

/**
 * A URL with nothing that identifies the person: no query (it can carry sign-in
 * codes), no hash, and every id segment replaced with `:id`. Anything that is
 * not an absolute URL is dropped.
 */
export function scrubUrl(url: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  const path = parsed.pathname
    .split('/')
    .map((segment) => (ID_SEGMENT.test(segment) ? ':id' : segment))
    .join('/');
  return `${parsed.origin}${path}`;
}

/**
 * Removes what an error report must not carry before it leaves the browser:
 * who the person is, request headers, cookies and query, breadcrumbs, ids in
 * any URL, and ids and email addresses in messages. The error and its stack
 * stay; they are what the report is for. Other text in a message (something
 * typed, quoted back by an error) cannot be recognised and is not removed.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const scrubbed: ErrorEvent = { ...event };
  delete scrubbed.user;
  delete scrubbed.breadcrumbs;
  if (event.message) scrubbed.message = scrubText(event.message);
  if (event.request) {
    const url = event.request.url && scrubUrl(event.request.url);
    scrubbed.request = url ? { url } : {};
  }
  if (event.exception?.values) {
    scrubbed.exception = {
      ...event.exception,
      values: event.exception.values.map((original) => {
        const value = original.value
          ? { ...original, value: scrubText(original.value) }
          : original;
        if (!value.stacktrace?.frames) return value;
        return {
          ...value,
          stacktrace: {
            ...value.stacktrace,
            frames: value.stacktrace.frames.map((frame) => {
              const next = { ...frame };
              if (frame.filename) {
                next.filename = scrubUrl(frame.filename) ?? frame.filename;
              }
              if (frame.abs_path) {
                next.abs_path = scrubUrl(frame.abs_path) ?? frame.abs_path;
              }
              return next;
            }),
          },
        };
      }),
    };
  }
  return scrubbed;
}
