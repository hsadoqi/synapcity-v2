# Notifications: triggers, channels and phases

Status: Draft, awaiting review. Date: 2026-10-17. Branch: `feat/settings-page`.

## Decision recorded

On 2026-10-17 the product owner moved notifications into scope (see `docs/product/non-goals.md`, "Notifications track"). Chosen:

- **Triggers:** account and security events; product announcements; reminders on user content.
- **Channels:** in-app with an optional sound; browser push; email.
- **Recording:** narrow the non-goal and keep the design here.

This is a separate track from the quick-capture first slice. `docs/product/first-slice.md` is unchanged and still excludes notifications from its hypothesis.

## Current state

- The Notifications settings tab stores three account preferences (`email`, `push`, `sound`) in `user_preferences` (ADR-0010). Until this track, nothing read them.
- Done in this change (phase 0): the push switch asks the browser for permission before it saves "on", shows "on" only when the saved choice and the browser's permission agree, and becomes read-only with the reason when the browser blocks or cannot show notifications. The tab says that nothing is sent yet.
- Nothing produces a notification. There is no user content yet (Documents and captures belong to the first slice), so reminders have nothing to attach to.

## Phases

Each phase is its own pull request, can be verified and reverted on its own, and removes the "nothing is sent yet" line only for the channels it makes real.

| Phase | Delivers                                                                                                                                                                                                       | Blocked on                             |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 0     | Honest settings tab; browser permission flow for push. **Done.**                                                                                                                                               | —                                      |
| 1     | A `notifications` table (owner-only RLS) and an in-app list in the shell, with unread state and the optional sound. First producer: account and security events raised by the existing auth server operations. | D1, D2                                 |
| 2     | Email for account and security alerts and announcements, with an unsubscribe link that turns the `email` preference off.                                                                                       | D3, D4                                 |
| 3     | Browser push: service worker, push subscriptions table, sender on the server.                                                                                                                                  | D5                                     |
| 4     | Reminders on user content.                                                                                                                                                                                     | D6, and Documents or captures existing |

## Decisions needed (owner approval, AGENTS.md section 5)

Each item gives a recommendation, the reason, and the evidence it was checked against on 2026-10-17 (sources at the end). None is decided until the owner approves it.

### D0. One way to send a notification (cross-cutting)

**Recommend:** every producer calls a single server operation, `notify(userId, kind, content)`, in a new `apps/web/src/features/notifications/` feature, following the server-operation pattern of ADR-0008. It writes the in-app row, then sends email or push only when the person's preferences allow that channel for that kind.

**Why:** preference checks live in one place, so a producer cannot forget them, and each channel can be tested against the same inputs.

### D1. Notification storage

**Recommend:** a Supabase table `public.notifications`: `id uuid`, `user_id uuid` (references `auth.users`, cascade on delete), `kind text` (checked against a fixed list), `title text`, `body text`, `href text` (a relative path inside the app, nullable), `created_at timestamptz`, `read_at timestamptz` (nullable).

- Row-level security: a person can select and delete only their own rows. Column privileges grant `update (read_at)` only, so a person can mark a row read but cannot change what it says.
- Inserts come only from the server (D0), never from the browser.
- Keep 90 days; pruning is a scheduled job (D6).
- Record it in a new ADR, since "Persistence, API, routing and state management" is still a candidate decision. ADR-0010 is the precedent: one table, RLS, server-validated writes.

### D2. How the open app learns of new notifications

**Recommend:** phase 1 fetches the unread list on load and when the window regains focus, with no new dependency. If that proves too slow, add Supabase Realtime **Broadcast** from a database trigger on a private, per-user channel, with an RLS policy on `realtime.messages` limiting each person to their own topic.

**Why:** Supabase's docs recommend Broadcast over Postgres Changes "for scalability and security". Realtime is already enabled in `supabase/config.toml`, and `@supabase/supabase-js` 2.117.3 is already a dependency, so the upgrade adds no package. It is still a new architectural mechanism, so it needs approval when it is proposed.

### D3. Email provider

**Recommend:** Resend (`resend` 6.34.1, published 2026-10-16), used in two ways:

1. as Supabase Auth's custom SMTP server, so sign-up, recovery and change-email messages leave from the same sender;
2. from `notify()` through its SDK, for everything else.

Postmark (`postmark` 5.1.0) is the strong alternative: it keeps transactional mail and announcements in separate streams, which protects deliverability.

**Why it matters now, separately from notifications:** Supabase's default mail service delivers only to members of the project's team, at 2 messages an hour, with no delivery guarantee, and Supabase calls it unsuitable for production. Until custom SMTP is set, auth emails cannot reach real users. Supabase lists both Resend and Postmark as working SMTP providers.

**Security:** the API key is a server-only secret (never `NEXT_PUBLIC_`), and the sending domain needs SPF, DKIM and DMARC records.

### D4. Email consent and the shape of the preferences

**Recommend:**

- Security alerts (a new sign-in, a changed password or email address) are always sent by email and are not switchable, because they protect the account.
- Product announcements get their own switch, `productNews`, defaulting to **off** (opt-in).
- The existing `email` switch then covers reminders and other non-essential mail.
- Every non-security email carries `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers. A signed, single-purpose unsubscribe link turns the matching preference off without signing in.

**Why:** opt-in is the safe default across jurisdictions. Gmail and Yahoo require one-click unsubscribe (RFC 8058) from bulk senders, and Resend's docs describe the same headers. Adding `productNews` changes the persisted `notifications` schema in `user_preferences`, so it needs approval and a default for existing rows.

### D5. Push delivery

**Recommend:** standard Web Push with VAPID keys, sent from the server with `web-push` 3.6.7, the approach in the Next.js PWA guide (last updated 2026-07-30).

- A service worker at `public/sw.js`, served with `Cache-Control: no-cache` and a strict CSP, as the guide shows.
- A `push_subscriptions` table: `id`, `user_id`, `endpoint` (unique), `p256dh`, `auth`, `created_at`; owner-only RLS.
- When the push service answers 404 or 410, delete that subscription.
- The VAPID private key is a server-only secret.

**Caveats:**

- `web-push`'s last release was January 2024. It is stable and widely used, but it gets little maintenance; record that next to the pin.
- On iPhone and iPad, web push works only for a site installed to the home screen, which needs a web app manifest. Mobile and PWA product surfaces stay a non-goal. So phase 3 targets desktop browsers and Android, with no install prompt, unless the owner reopens that non-goal.
- A hosted push service is the alternative, but it adds a third party that would receive notification content and device identifiers. Not recommended.

### D6. Scheduling (reminders and pruning)

**Recommend:** Supabase Cron, which is built on `pg_cron`. A job every minute turns due reminders into `notifications` rows inside the database. The same job prunes rows older than 90 days. Email and push for those rows go through a server route called by the job.

**Why:**

- The reminders live in the database, so creating the in-app notification needs no network hop.
- Supabase Cron schedules down to once a second and can call HTTP endpoints.
- A Vercel cron would tie scheduling to a deployment topology that is still undecided.

**Limits from Supabase's docs:** at most 8 jobs running at once and 10 minutes per job, both recommendations rather than hard limits.

This reopens part of the "scheduling infrastructure" non-goal, so it needs its own approval. It also waits for Documents or captures to exist.

### Suggested order

Configure Resend as Supabase Auth's SMTP first (D3, step 1). It needs no code, and it fixes auth email for real users today. Then do D0, D1 and D2 together as phase 1. D4 comes before any announcement is sent.

## Sources (checked 2026-10-17)

- Supabase, custom SMTP: <https://supabase.com/docs/guides/auth/auth-smtp>
- Supabase, subscribing to database changes (Broadcast vs Postgres Changes): <https://supabase.com/docs/guides/realtime/subscribing-to-database-changes>
- Supabase Cron: <https://supabase.com/docs/guides/cron>
- Next.js, Progressive Web Apps guide (web push, last updated 2026-07-30): <https://nextjs.org/docs/app/guides/progressive-web-apps>
- Resend, unsubscribe headers for email: <https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails>
- npm registry, latest versions: `resend` 6.34.1, `postmark` 5.1.0, `web-push` 3.6.7 (read from registry.npmjs.org)

## Verification per phase

- Phase 0: `notification-settings.dom.test.tsx` covers permission granted, declined, blocked and unsupported. The browser prompt itself is not exercised; check by hand in Chrome and Safari.
- Phases 1 to 4: RLS tests that one user cannot read another's notifications; a test that each producer respects the matching preference; end-to-end check of the in-app list.
