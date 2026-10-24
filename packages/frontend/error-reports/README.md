# @synapcity/frontend-error-reports

Owns: the consent-gated browser Sentry adapter and privacy scrubber. The package sends only error events, and only after the person allows error reporting.

The web host supplies the DSN, release, and runtime environment. Consent comes from `@synapcity/frontend-preferences`. No tracing, replay, session tracking, or user identity is added.

## Public interface

`@synapcity/frontend-error-reports` exports `ErrorReports` and `reportCaughtError`. The component renders nothing and starts or stops the SDK as consent changes. `reportCaughtError` is used by host error boundaries for errors that global handlers do not capture.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage`. Tests use a fake SDK and jsdom; they do not send events to Sentry.
