# Route-group probes

Throwaway Playwright scripts used while verifying the route groups (2026-10-29). They are kept as evidence of what was measured, not as tests: the repeatable checks are `apps/web/e2e/` and the unit and DOM tests.

Each script reads the local Supabase stack's keys from `supabase status` at run time (nothing is stored here), creates one temporary `route-groups-verify-*@example.test` user with a placeholder password, and deletes the user (and, where it reads mail, the mail) when it finishes. Run from the repository root with a build served against the local stack; set `WORKTREE` if the working directory is elsewhere. They resolve `@playwright/test` from `apps/web`.

| Script            | What it measured                                                     |
| ----------------- | -------------------------------------------------------------------- |
| `explore.mjs`     | First pass over public, auth and owner pages signed in               |
| `dump.mjs`        | Page structure dump helper                                           |
| `meta.mjs`        | Effective `og:image` and card metadata on owner routes               |
| `space404.mjs`    | 404 shell for a missing Space                                        |
| `doc404.mjs`      | 404 shell for a missing document                                     |
| `raw404.mjs`      | Raw response of a 404 inside a matched dynamic route                 |
| `raw404-main.mjs` | The same measurement against `origin/main` (separate worktree)       |
| `slots404.mjs`    | Which shell slot each 404 renders after hydration                    |
| `link.mjs`        | Inspecting the mailed reset link and its redirects                   |
| `a11y.mjs`        | Responsive and keyboard sweep (result committed as the sibling JSON) |
