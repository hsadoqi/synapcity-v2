# Synapcity agent contract

**Architecture reorganization — 2026-10-23:** [ADR-0014](docs/architecture/decisions/0014-multi-app-package-boundaries.md) governs the selected five-category topology and dependency/runtime matrix. Read the [ownership map](docs/architecture/reorganization-ownership-map.md) before moving existing code. Older app-local/category placement statements are amended only within ADR-0014's scope; behavior, security, preservation, and approval requirements continue. Planned consumers and independent boundaries can justify early extraction; a second implemented app is not required. Source migration is not complete. `pnpm boundaries` enforces the workspace import rules (§6).

This file is the canonical entry-point contract for AI-assisted work in Synapcity. It is intentionally short — it tells a fresh agent what authority to check and where the deeper rules live. It does not duplicate the content of the documents it links to.

Direct instructions from the human repository owner override this document. A tool-specific instruction file may add narrower guidance but must not silently alter product authority, approve an open decision, or weaken a repository safety rule.

## 1. Authority hierarchy

1. Direct, current human instruction.
2. A Canonical or Current-direction document within its stated scope (`PRODUCT.md`, `docs/product/*`, `docs/architecture/principles.md`, accepted ADRs).
3. The current open-decision state — `PRODUCT.md`'s "Open product decisions" (product/concept and terminology), `docs/glossary.md` (terminology status), and `docs/architecture/decisions/README.md`'s candidate list together with each accepted ADR's own "Unresolved" section (architecture/implementation). Check these before assuming anything is settled.
4. Approved specifications and plans.
5. Current implementation and tests as evidence of behavior — never as product or architecture authority on their own.
6. Research, proposals, experiments, historical material, and anything in the previous implementation — evidence, never authority. See `docs/engineering/documentation.md` for the full status/authority model.

## 2. Read before you change anything

1. `README.md` for repository status and navigation.
2. `PRODUCT.md` for the product foundation.
3. `docs/glossary.md` for terminology status.
4. `docs/product/scope.md`, `docs/product/non-goals.md`, `docs/product/principles.md`, `docs/product/mvp.md` for scope and principles.
5. `docs/architecture/principles.md`, any relevant accepted ADR in `docs/architecture/decisions/`, and that index's candidate list for unresolved decisions relevant to your task.
6. The owning module and its real consumers, once implementation exists.

Follow links progressively. Do not read the whole documentation tree for a narrow task.

## 3. Three decision dimensions — never conflate them

> **Concept adoption does not imply terminology adoption, and neither implies implementation adoption.**

For every consequential proposal, identify which dimension you're touching: product concept/requirement, terminology/naming, or implementation/architecture. A concept can be adopted while its name and implementation remain unresolved. Never derive a schema, package, route, table, API, or component name from a working label alone — check `docs/glossary.md`'s naming-decision process first.

## 4. Preservation and destructive changes

The previous implementation — an external, historical evidence source; never assume it is the repository you are currently working in — is evidence, not authority, and is never migrated wholesale. See `docs/engineering/preservation-policy.md` for the full policy — in short: preserve unless explicitly authorized to clean up, evaluate concept/terminology/behavior/tests/implementation independently, prefer archive over delete, and require exact scope plus a recovery plan for anything destructive.

## 5. Approval gates

Obtain explicit human approval before: changing product purpose/scope/principles/vocabulary; selecting or changing the first product slice; choosing or changing architectural ownership; adopting package/repository topology; selecting storage/database/API/routing/state-management/auth/deployment architecture; introducing an architecturally- or security-consequential dependency; creating or changing persisted schemas, public APIs, or durable identifiers; selecting a relationship taxonomy or lifecycle model; converting an experiment into canonical production code; destructive or irreversible changes; adding externally consequential or security-sensitive behavior; resolving anything marked UNRESOLVED in `PRODUCT.md`, `docs/glossary.md`, or `docs/architecture/decisions/README.md`'s candidate list. Full detail and rationale: `docs/engineering/ai-development.md` and `docs/engineering/ai-security-baseline.md`.

## 6. Verification is required, not optional

Before claiming completion, run all repository-defined formatting, linting, type-checking, unused-code and build checks proportional to the change (see `docs/engineering/definition-of-done.md`), plus manual checks for visual/interaction/accessibility behavior where relevant. The repository-defined checks are the root scripts in `package.json`: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm deps` (Knip: unused files, exports, dependencies), `pnpm boundaries` (workspace import boundaries from ADR-0014: the dependency matrix, server code reachable from browser code, imports that bypass `exports`, cycles and the `server-only` guard; rules and named exceptions in the workspace conventions' Boundary checks), `pnpm brand:check` (static brand exports match the logo geometry in `logo-mark.tsx`; it cannot check the PNG/ICO rasters), `pnpm test` (Vitest unit and component tests), `pnpm test:coverage` (the same tests with v8 coverage, no thresholds), `pnpm test:e2e` (Playwright end-to-end smoke test of `apps/web`, Chromium only), `pnpm test:storybook` (Storybook story tests in a Chromium browser, including the a11y addon's axe checks), `pnpm build` (Turbo builds every workspace), and `pnpm verify`, which runs all of them except plain `pnpm test` (`pnpm test:coverage` runs the same tests) in the order the root `package.json` defines, with lint and type-checking in one Turbo run, and stops at the first failure. Every component in `packages/frontend/ui` has a story and a unit test, enforced by `packages/frontend/ui/src/package-structure.test.ts`; auth and web app coverage is partial and there is one end-to-end smoke test, so a green `pnpm verify` proves only what those tests exercise. Say what was and was not covered, and do not claim "tested" for behavior they do not reach. Browsers are not installed by `pnpm install`; run `pnpm exec playwright install chromium` once per machine. Testing is Proposed, not Accepted, in ADR-0005. Update this list as tooling changes; do not predeclare commands that don't yet exist. CI (`.github/workflows/ci.yml`) invokes the same `pnpm verify` as the pre-push hook; branch, pull request, and commit conventions are in `docs/engineering/quality-gates.md`, and the toolchain is ADR-0001. Report exactly what ran, what passed, what failed, and what was **not** run. A verification report that cannot say "not verified" where that's true is not trustworthy.

## 7. Concise operating rules

- Determine the interaction mode before acting: investigating, brainstorming, deciding, experimenting, implementing, or reviewing. A question ("could this work?") is not authorization to implement.
- **Read broadly; mutate narrowly.** Mutation authority is specific to both the named artifact and the named system. Permission to change one file, issue, project, backlog, setting, or tool does not authorize adjacent mutation classes, and anything not listed in the approved task scope is forbidden. If a requested path, field, option, or exact destination is missing, stop and report it; do not substitute the nearest available value.
- Nothing becomes canonical merely because an AI produced it successfully — see `docs/engineering/ai-development.md`.
- "Implemented," "tested," "consumed," "exercised," "product-required," "product-validated," and "canonical" are different claims. Use the precise one. See `docs/engineering/definition-of-done.md`.
- Do not treat repetition across documents as independent corroboration — check whether they share an origin before treating agreement as confirmation.
- When you hit a stop condition or an unresolved decision, stop and report it rather than resolving it. See `PRODUCT.md`'s "Open product decisions", `docs/glossary.md`, and `docs/architecture/decisions/README.md`'s candidate list.

## 7a. Version-sensitive decisions: verify, do not recall

Do not rely on model memory for version-sensitive technical decisions. Before introducing or materially changing framework APIs, package or tool configuration, integration patterns, build tooling, or anything whose recommended usage varies by version, follow this order:

1. **Repository-declared version.** Read the version this repository actually declares and installs (`package.json`, lockfile, ADR-0001). It is authoritative for what runs here.
2. **Current upstream guidance for that version.** Verify the approach against current first-party evidence: official documentation for that version, migration guides, release notes, the project's repository or issue tracker, standards, and the package registry. Prefer them over tutorials, forum answers, prior AI output, or code without version context. Confirm "latest" from the registry, not from memory.
3. **Accepted Synapcity decisions.** ADRs and this contract are authoritative project constraints. Upstream guidance is evidence about the external technology, not an override of them. Keep the two distinct when you report.
4. **Conflicts.** If upstream guidance conflicts with an accepted decision or with existing repository guidance, do not silently follow either. Surface the conflict and stop for a human decision. Report stale repository guidance you find.
5. **Approved implementation, then verification** per §5 and §6.

Rules that follow:

- Do not introduce deprecated or superseded techniques unless a documented requirement demands them, even if they still work.
- A dependency upgrade is its own separately scoped change with its own compatibility analysis and verification. Do not upgrade as a side effect of other work. Latest stable is the default for a new or deliberately changed dependency, not a reason to change an existing pin. Stay on an older version only for a concrete reason (a peer-dependency range that excludes the newer release, a runtime mismatch such as `@types/node` needing the pinned Node major) and record that reason in the relevant ADR or beside the pin. Never silence a peer-dependency warning to reach a newer version.
- Support claims such as "recommended", "deprecated", "unsupported", or "latest stable" with current evidence, and name the source in your report. If current authoritative evidence cannot be reached, mark the claim NOT VERIFIABLE instead of substituting remembered guidance.
- This does not bypass §5. New dependencies with architectural or security consequences, and changes to the runtimes declared in ADR-0001, still need explicit human approval.

## 7b. Working method

Follow the investigate, plan, approve, execute, verify, report lifecycle in `.agents/README.md`, and bound each task with `.agents/task-scope.md`. Use the matching workflow in `.agents/workflows/` for the kind of work; any work that creates or changes plans, tasks, issues, milestones, project metadata, or another planning surface must follow the [planning-artifacts workflow](.agents/workflows/planning-artifacts.md). Merge a pull request only after CI is green and the human has authorized merging, and never write a GitHub closing keyword near an issue reference in a pull request or commit, even negated (`docs/engineering/quality-gates.md`).

## 8. Where the deeper rules live

| Concern                                                                               | Document                                                    |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Product foundation, scope, principles, MVP process                                    | `PRODUCT.md`, `docs/product/`                               |
| Terminology and naming                                                                | `docs/glossary.md`                                          |
| Architecture principles                                                               | `docs/architecture/principles.md`                           |
| Accepted technical directions and their governance, plus open architecture candidates | `docs/architecture/decisions/`                              |
| What is and isn't decided (product/terminology)                                       | `PRODUCT.md`'s "Open product decisions", `docs/glossary.md` |
| Agent lifecycle, task scope, and workflows                                            | `.agents/README.md`                                         |
| Documentation status and authority                                                    | `docs/engineering/documentation.md`                         |
| Engineering verification standard                                                     | `docs/engineering/definition-of-done.md`                    |
| AI-assisted development governance                                                    | `docs/engineering/ai-development.md`                        |
| AI security/trust baseline                                                            | `docs/engineering/ai-security-baseline.md`                  |
| Preservation and destructive-change policy                                            | `docs/engineering/preservation-policy.md`                   |

## 9. Completion and handoff

Before claiming completion, report: what changed and why it belongs where it landed; what adopted behavior was preserved; which decisions were intentionally left undecided; exact checks run and their results; checks not run; pre-existing failures; any fixtures, prototypes, quarantined, archived, or uncommitted artifacts; unresolved risks and the next safe action.

<!-- roast-my-design-system:rules:begin (generated from a scan; this block is replaced by --apply, text outside it is never touched) -->

## Design system rules

<!-- Rewritten by hand on 2026-10-13 for the current repository. The earlier text was generated by
     roast-my-design-system from a scan of the previous implementation (2026-10-05) and described
     components and paths that do not exist here. Re-run the scan (`npx roast-my-design-system@latest --rules`)
     after the component set grows, and keep any hand corrections. The decisions behind these rules are
     ADR-0002 (styling), ADR-0003 (typography) and ADR-0004 (`cn`) in `docs/architecture/decisions/`. -->

Follow these rules when writing or editing UI in this repo.

### Where things live

- Design tokens live in `packages/frontend/tailwind-config`. `shared-styles.css` is the entry; `tokens/` holds the pieces (`utilities.css` has the `theme-light` and `theme-dark` colour values, `base.css` the base element styles, `accessibility.css` reduced motion, `variants.css` the `dark` variant). Reach for an existing token before inventing any value, and change a token there, never in an app or component.
- Apps contain wiring only. `apps/web/src/styles/globals.css` is imports and `@source` lines; do not add `:root`, `.dark`, `@theme` or `@layer base` rules to it, and remove them if `shadcn init` or `shadcn add` writes them back.
- Shared components live in `packages/frontend/ui/src/components/ui` and are consumed as `@synapcity/frontend-ui/core/*`. Prefer extending them over building parallel pieces.

### Colours

- Never hardcode colour values in components. Use the semantic classes the theme gives you (`bg-background`, `text-muted-foreground`, `border-border`), never a palette colour like `bg-blue-500` or `text-gray-600`, and never a hand-written `dark:` colour. The variables already carry both modes.
- Colour values are set once, in `packages/frontend/tailwind-config/tokens/utilities.css` (`theme-light`, `theme-dark`) and mapped to Tailwind colours in `shared-styles.css` (`@theme inline`).

### Components installed

- Look in `packages/frontend/ui/src/components/ui` before writing a component; use what is installed instead of writing a new one. If you need a new variant or prop, add it to the component you own.
- This is a shadcn install: style `base-mira` on Base UI (`@base-ui/react`), base colour neutral, icons from `lucide-react` only.
- Add a component with `pnpm ui:add <name>` from the repository root (it targets `apps/web` and writes into `@synapcity/frontend-ui`), then move it into its own `name/` folder with `name.stories.tsx`, `name.test.tsx` and `index.ts` (the shadcn CLI writes flat files; `package-structure.test.ts` fails until you do) and edit it. Upstream differences: `pnpm dlx shadcn@latest add <name> --diff -c apps/web`.
- Edit the component you own. Never build a second one beside it under another name. A wrapper that composes shadcn components is fine; a second implementation is not.
- Before adding classes to a shadcn component, use one of its variants (`variant="outline"`, `size="sm"`). `className` on a shadcn component is for layout only: width, margin, position. Never colour, never typography; add a variant instead.
- Merge classes with `cn()` (ADR-0004). Never concatenate strings and never write a ternary inside a className string.

### Spacing, sizing and radius

- Stay on the Tailwind spacing scale. If a gap looks wrong on a scale step, flag it instead of nudging by a pixel.
- Bracket values in `packages/frontend/ui/src/components/ui` are shadcn's, not a pattern to copy. In your own code, do not write a bracket value: use a step from the scale, or a variable from the theme. If a value you need is missing, add it to the theme once and use it by name.
- Radius comes from `--radius-base` (0.25rem) and the scale derived from it; never a bracket value. Never change `--spacing` in a component or one-off style: it resizes every gap in the app.
- Small habits shadcn expects: `gap-*` not `space-x/y-*`; `size-4` not `w-4 h-4`; `truncate` for one-line clipping; no `z-index` on Dialog, Sheet, Popover or Tooltip, they stack themselves.

### Typography

- Four roles, set by tokens: `--font-body` (Inter, reading text), `--font-ui` (Inter, controls and labels), `--font-heading` (Geist) and `--font-code` (Geist Mono, code only). Do not declare a font stack in a component or app (ADR-0003).
- User font choice is a runtime override through `--font-preference-heading`, `--font-preference-body`, `--font-preference-code` and optionally `--font-preference-ui`, never a code change. Fonts are loaded in `apps/web/src/app/layout.tsx` through `next/font`; add a selectable font by adding a loader there.

### Styling discipline

- Never write `style={{ ... }}` for static values; styling belongs to classes and tokens where the system can see it.
- Never write `!important`. When a style does not apply, fix the selector or the source of the conflict instead of forcing the style through.
- Before styling anything new, look at a neighbouring component and match how it does it.

<!-- roast-my-design-system:rules:end -->

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
