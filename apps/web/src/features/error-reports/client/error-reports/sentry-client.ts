import { scrubEvent } from '../../shared/scrub-event';

type Sentry = typeof import('@sentry/browser');

// The SDK is downloaded only once someone allows error reports, never before.
let sdk: Promise<Sentry> | null = null;
// Cleared the moment consent is withdrawn. `close()` flushes before it stops
// the client, so `beforeSend` checks this too and drops anything in between.
let allowed = false;
// Starting, stopping and capturing run one after another, so turning reports
// off and on again cannot start a client that the earlier close then unbinds.
let queue: Promise<void> = Promise.resolve();

function enqueue(step: (sentry: Sentry) => unknown) {
  sdk ??= import('@sentry/browser');
  const loaded = sdk;
  queue = queue
    .then(() => loaded)
    .then(step)
    .then(
      () => undefined,
      () => {
        // A failed download is tried again next time; reports are best effort.
        if (sdk === loaded) sdk = null;
      },
    );
}

/**
 * Loads Sentry and starts reporting browser errors. Does nothing without
 * `NEXT_PUBLIC_SENTRY_DSN`. Only errors: no tracing, replay, sessions,
 * breadcrumbs or user data, and every event is scrubbed before it is sent.
 */
export function startErrorReports() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || allowed) return;
  allowed = true;
  enqueue((Sentry) => {
    if (!allowed || Sentry.getClient()) return;
    Sentry.init({
      dsn,
      defaultIntegrations: false,
      integrations: [
        Sentry.globalHandlersIntegration(),
        Sentry.linkedErrorsIntegration(),
        Sentry.dedupeIntegration(),
      ],
      maxBreadcrumbs: 0,
      sendClientReports: false,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        urlQueryParams: false,
        httpBodies: [],
      },
      beforeSend: (event) => (allowed ? scrubEvent(event) : null),
    });
  });
}

/** Stops reporting at once and shuts the client down. */
export function stopErrorReports() {
  if (!allowed) return;
  allowed = false;
  enqueue((Sentry) => Sentry.close());
}

/**
 * Reports an error that an error boundary caught, which the global handlers
 * never see. Does nothing unless error reports are on.
 */
export function reportCaughtError(error: unknown) {
  if (!allowed) return;
  enqueue((Sentry) => {
    if (allowed) Sentry.captureException(error);
  });
}
