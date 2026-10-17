import type { ErrorEvent } from '@sentry/browser';

// Supabase user ids, which appear in routes such as /<userId>/settings.
const ID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
 * who the person is, request headers, cookies and query, breadcrumbs, and ids
 * in any URL. The error and its stack stay; they are what the report is for.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const scrubbed: ErrorEvent = { ...event };
  delete scrubbed.user;
  delete scrubbed.breadcrumbs;
  if (event.request) {
    const url = event.request.url && scrubUrl(event.request.url);
    scrubbed.request = url ? { url } : {};
  }
  if (event.exception?.values) {
    scrubbed.exception = {
      ...event.exception,
      values: event.exception.values.map((value) => {
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
