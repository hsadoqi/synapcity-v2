# Synapcity Phase 2 — Technical Foundation Implementation Plan

**Status:** Proposed implementation plan  
**Phase:** Phase 2 — Technical Foundation
**Implementation authorization:** Not granted by this document alone  
**Primary question:** Can we trust the Synapcity technical foundation and monorepo before building product architecture?

---

## 1. Phase 2 objective

Phase 2 turns the Phase 1 governance-only repository into a small but real, reproducible, deployable monorepo.

It should prove that Synapcity can support:

- a Next.js application runtime;
- an independently deployable Storybook/UI-system runtime;
- a reusable React/web UI package;
- modern CSS/Tailwind styling;
- component source acquired and owned through shadcn;
- unit/component/browser/accessibility testing;
- workspace task orchestration;
- architectural boundary enforcement;
- production builds;
- GitHub CI;
- Vercel preview and production deployments;
- a fresh-clone verification path.

Phase 2 does **not** build Synapcity product functionality.

The target is a technical foundation, not an application shell.

---

## 2. Phase 2 execution model

Implementation proceeds through six ordered logical delivery stages:

```text
1. Workspace + Runtime Foundation
              ↓
2. UI + Styling + Storybook Foundation
              ↓
3. Testing + Accessibility Foundation
              ↓
4. Integration + Golden Path
              ↓
5. Verification Contract
              ↓
6. CI + Deployment
```

Phase 2 is implemented through eight reviewable execution slices in §13. The
slices map onto the logical stages, but do not replace or rename them:

| Logical stage | Execution slice(s) |
| --- | --- |
| Workspace + Runtime Foundation | Slice 1 — Decision evidence; Slice 2 — Workspace/runtime |
| UI + Styling + Storybook Foundation | Slice 3 — UI/Storybook |
| Testing + Accessibility Foundation | Slice 4 — Testing foundation |
| Integration + Golden Path | Slice 5 — Golden-path integration |
| Verification Contract | Slice 6 — Verification contract |
| CI + Deployment | Slice 7 — CI; Slice 8 — Deployment |

Each stage has explicit acceptance criteria.

A later stage must not be used to compensate for an earlier stage that does not work locally.

In particular:

> CI must automate a working local verification contract. It must not become the environment in which the architecture is first integrated or debugged.

---

## 3. Technical baseline

Resolve exact patches immediately before the first dependency-changing implementation commit, using current first-party evidence.

The repository already accepts and declares Node `24.20.0`, pnpm `10.24.0`,
and the existing Phase 1 TypeScript, ESLint, Vitest, and related tooling. Their
authority comes from accepted ADRs and the versions actually declared in the
repository, not from this plan. See [ADR-0003](../../architecture/decisions/0003-repository-topology.md),
[ADR-0004](../../architecture/decisions/0004-toolchain-baseline.md), and the
root [`package.json`](../../../package.json).

The following is a **proposed Phase 2 research baseline pending Slice 1 decision
evidence and approval**:

| Concern | Proposed research baseline |
| --- | --- |
| Next.js | patched 16.3.x candidate |
| React | 19.3.x candidate |
| Turborepo | compatible 2.x candidate, exact version to be pinned |
| Tailwind CSS | 4.3.x candidate |
| Storybook | 10.6.x candidate |
| shadcn CLI | 4.x candidate |
| shadcn primitive base | Base UI candidate |
| Playwright | compatible stable candidate, exact version to be pinned |
| New testing/browser integrations | exact packages and versions to be resolved from real consumers |

These candidates are research inputs, not approved dependency decisions. Slice
1 must recheck the package registry and current first-party documentation,
confirm compatibility with the accepted repository pins, and record the exact
approved versions before installation. The durable evidence links for the
proposed integration techniques are collected in the Phase 2 design's
[version-sensitive evidence section](../../architecture/designs/phase-02-technical-foundation.md#17-version-sensitive-evidence-checked-on-2026-09-27).

Do not encode transient patch numbers into architectural rules where a supported generation is what matters.

Version-sensitive ADRs should record:

- approved generation/version at decision time;
- first-party evidence;
- verification date;
- integration technique;
- reconsideration trigger.

---

## 4. Global implementation guardrails

Throughout Phase 2:

- do not introduce product functionality;
- do not create application shell/navigation architecture;
- do not introduce Documents or Lexical;
- do not introduce persistence/database/API/auth architecture;
- do not introduce Zustand or product state;
- do not create a dynamic theme system;
- do not create a `features` category;
- do not create speculative UI package layers;
- do not create configuration packages merely because `packages/dev` exists;
- do not add dependencies without a demonstrated Phase 2 consumer;
- do not use deep imports between workspaces;
- do not weaken Phase 1 architecture-boundary enforcement;
- do not allow configured-but-empty gates to count as successful evidence.

The rule for reusable infrastructure remains:

> Build the consumers first. Extract shared policy only after actual duplication demonstrates a reusable ownership boundary.

---

## 5. Stage 1 — Workspace + Runtime Foundation

### Goal

Create the first executable monorepo runtime while preserving the architecture and governance established in Phase 1.

### Prerequisites

Before dependency installation:

1. reconciliation changes are committed;
2. working tree is understood and clean enough for controlled implementation;
3. exact current compatible versions are resolved;
4. required runtime/workspace ADR decisions are accepted.

### 5.1 Record runtime decisions

Create the Phase 2 application-runtime decision record.

It should establish:

- Node 24 LTS;
- Next.js 16;
- React 19.3;
- App Router;
- Server Components/default server composition;
- narrow client boundaries;
- apps own Next/framework-runtime concerns;
- `ui` packages may own reusable React/web behavior but not application runtime;
- version/reconsideration policy.

Next.js 16.3.x and React 19.3.x are proposed research candidates. Slice 1 must
verify their current release status and compatibility against first-party
evidence before this decision record is accepted.

### 5.2 Resolve and pin dependency versions

Produce a dependency evidence table before modifying the lockfile.

For every Phase 2 dependency record:

```text
dependency
approved version
consumer
reason required
first-party evidence
date checked
```

Do not install unrelated “probably useful later” libraries.

### 5.3 Introduce Turborepo

Add Turbo as task orchestration.

Ownership:

```text
pnpm
→ dependency graph
→ workspace installation
→ package manager

Turbo
→ task graph
→ dependency-aware execution
→ task caching

pnpm verify
→ canonical repository correctness contract
```

Turbo does not replace pnpm workspaces.

### 5.4 Create `apps/web`

Create the smallest valid Next.js App Router application.

It should initially contain only enough application code to prove:

- Next starts;
- TypeScript works;
- linting covers TSX;
- production build succeeds;
- later integration can consume `@synapcity/ui-core`.

Do **not** create:

- Synapcity shell;
- sidebars;
- navigation architecture;
- dashboard routes;
- Documents;
- app state;
- API routes unless technically required by the framework bootstrap.

The root page should remain a technical-foundation canvas.

### 5.5 Establish local TypeScript configuration

Configure TypeScript correctly for:

- root/tooling;
- `apps/web`;
- future React package consumption.

Do not extract a TypeScript config package yet.

Use configuration appropriate to the repository's declared TypeScript 6 line
and accepted [toolchain baseline](../../architecture/decisions/0004-toolchain-baseline.md),
rather than carrying forward options that current TypeScript documentation marks
as deprecated.

### 5.6 Establish ESLint coverage

Ensure ESLint 10 actually covers:

```text
.ts
.tsx
.js
.jsx
```

as applicable.

Do not count a passing lint command that never sees application TSX as Phase 2 evidence.

Keep framework-specific policy local initially.

Do not create `@synapcity/dev-eslint-config` yet.

### 5.7 Establish initial Turbo tasks

At minimum define task semantics for:

```text
build
lint
typecheck
test
```

Exact task expansion occurs as later stages add Storybook/browser verification.

### Stage 1 outputs

```text
apps/
└── web/

turbo.json

working Next runtime
working TypeScript
working ESLint over real TSX
dependency/version evidence
application-runtime ADR
```

### Stage 1 acceptance criteria

- `apps/web` starts locally.
- `apps/web` production build succeeds.
- TypeScript checks real app source.
- ESLint checks real TSX.
- Turbo discovers the workspace and task graph.
- dependency-cruiser sees the app.
- no package imports from `apps/web`.
- no product architecture has been introduced.

---

## 6. Stage 2 — UI + Styling + Storybook Foundation

### Goal

Create one real reusable presentation boundary and an independent Storybook
consumer. This stage establishes the public export and shared styling source
that the web application consumes during Stage 4; it does not claim the complete
web-and-Storybook integration proof yet.

Stage 2 target:

```text
@synapcity/ui-core
        |
        v
apps/storybook

apps/web
→ prepared for public-export and shared-style integration in Stage 4
```

Neither application depends on the other.

---

### 6.1 Create `@synapcity/ui-core`

Create:

```text
packages/ui/core
```

with manifest name:

```text
@synapcity/ui-core
```

Initial ownership is intentionally narrow:

- reusable React/web primitives;
- intrinsic browser presentation behavior;
- foundational shared styling;
- small semantic presentation tokens;
- component-owned stories;
- component-owned tests;
- directly required UI utilities.

It must not own:

- Next.js routing;
- request/server APIs;
- application providers;
- application state;
- product semantics;
- product domain behavior.

---

### 6.2 Configure Tailwind v4

Use a v4-native CSS-first setup.

Do not create a legacy Tailwind JS/TS configuration by default.

Separate concerns:

```text
CSS custom properties
→ semantic/runtime presentation values

@theme / Tailwind CSS APIs
→ utility-generation integration
```

[Tailwind's first-party theme-variable documentation](https://tailwindcss.com/docs/theme)
defines the proposed CSS-first model and shared theme-variable mechanism. The
exact Tailwind version remains subject to Slice 1 approval.

The shared UI package should own reusable presentation semantics.

The applications should own their build-tool Tailwind integration.

Do not create:

```text
@synapcity/dev-tailwind-config
```

during initial setup.

---

### 6.3 Configure shadcn as source acquisition

Adopt:

```text
shadcn CLI 4.x
Base UI
CSS variables
OKLCH
```

[shadcn's first-party monorepo guidance](https://ui.shadcn.com/docs/monorepo)
documents shared-workspace source acquisition and Tailwind v4 integration. The
CLI version and Base UI selection remain proposed until Slice 1 approval.

Important rule:

> shadcn is a source-acquisition and maintenance mechanism, not Synapcity's architectural package model.

Do not let `shadcn init --monorepo` redefine the repository topology.

Generated/adapted component source belongs to Synapcity after acquisition.

Do not create:

```text
ui-shadcn
```

or another package merely to represent where source came from.

---

### 6.4 Add one representative primitive

Add exactly one representative primitive initially.

Preferred candidate:

```text
Button
```

It is intentionally simple.

Its purpose is to exercise:

- shadcn acquisition;
- Base UI where applicable;
- React;
- package exports;
- CSS;
- Tailwind;
- Storybook;
- tests;
- accessibility;
- web consumption.

Do not begin building a component catalog.

---

### 6.5 Create `apps/storybook`

Create an independently buildable Storybook application:

```text
apps/storybook
```

Use Storybook 10.6 and the Vite-based Next integration.

[Storybook's first-party story configuration](https://storybook.js.org/docs/api/main-config/main-config-stories)
supports discovering colocated stories, and its
[sharing guidance](https://storybook.js.org/docs/sharing) documents independent
static builds. The Storybook generation, framework, and builder remain proposed
until Slice 1 approval.

Storybook owns:

- Storybook runtime;
- `.storybook` configuration;
- story discovery;
- global preview/decorators;
- loading shared CSS;
- Storybook-specific addons;
- independent build.

Stories remain colocated with their components in `@synapcity/ui-core`.

---

### 6.6 Record UI/Storybook architecture decisions

Required durable decisions should capture:

#### UI/styling

- `@synapcity/ui-core`;
- React/web ownership;
- Tailwind v4 CSS-first model;
- semantic CSS ownership;
- shadcn as source acquisition;
- Base UI selection;
- rejection of speculative UI layering.

#### Storybook

- Storybook is an independent application/artifact;
- it consumes `ui-core`;
- stories remain component-owned;
- it can later serve as a portfolio/design-system showcase.

These may be separate ADRs if that keeps ownership clearer.

### Stage 2 outputs

```text
apps/
├── web/
└── storybook/

packages/
└── ui/
    └── core/
        ├── package.json
        └── src/
            ├── components/
            ├── styles/
            └── index.ts
```

plus:

```text
Button
Button story
shared styling
Storybook runtime
public package API
```

### Stage 2 acceptance criteria

- `ui-core` builds/typechecks.
- `ui-core` imports no application code.
- React/web dependencies are valid under architecture rules.
- no Next imports exist in `ui-core`.
- Storybook starts.
- Storybook discovers the Button story.
- Storybook production build succeeds.
- package consumers can use only the public package API.
- complete web consumption and cross-workspace integration are not claimed until Stage 4.

---

## 7. Stage 3 — Testing + Accessibility Foundation

### Goal

Establish the testing layers before using them as integration proof.

Testing layers:

```text
Static checks
      ↓
Fast code/component tests
      ↓
Browser component/story tests
      ↓
Accessibility checks
      ↓
Application browser smoke
```

---

### 7.1 Configure Vitest 5

Use Vitest 5.

Use the current `test.projects` model rather than introducing deprecated workspace-era configuration.

The repository already declares Vitest 5 under its accepted Phase 1 toolchain
baseline. [Vitest's first-party projects guidance](https://vitest.dev/guide/projects)
governs the proposed multi-project configuration technique; any new integration
packages still require Slice 1 evidence and approval.

Initial fast test environments:

```text
node
jsdom
```

as appropriate.

---

### 7.2 Add React Testing Library

Use React Testing Library for focused component behavior.

The representative Button should have at least one real test verifying behavior through user-facing semantics.

Prefer accessible queries over implementation selectors.

Example responsibilities:

- renders accessible name;
- invokes callback;
- honors disabled state where applicable.

---

### 7.3 Configure Storybook browser testing

Use:

```text
@storybook/addon-vitest
```

with:

```text
Vitest Browser Mode
→ Playwright provider
→ Chromium
```

[Storybook's first-party Vitest addon documentation](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
documents converting stories into browser component tests and using a browser
provider with Vite-based Storybook frameworks.

The Button story should therefore become executable verification evidence, not merely documentation.

---

### 7.4 Configure accessibility testing

Use:

```text
@storybook/addon-a11y
```

and automated axe checks.

Project-default accessibility behavior should fail CI for actual violations:

```text
a11y.test = 'error'
```

[Storybook's first-party accessibility testing documentation](https://storybook.js.org/docs/writing-tests/accessibility-testing)
documents running accessibility checks with story tests and configuring
violations to fail the test run.

Exceptions must be explicit and scoped.

Do not globally suppress accessibility findings.

Retain appropriate static JSX accessibility linting as a complementary layer.

---

### 7.5 Add Playwright application smoke infrastructure

Use Playwright proper for the application boundary.

Phase 2 requires only a minimal web smoke suite.

Do not create broad product E2E tests.

Target browser:

```text
Chromium
```

initially.

A future product requirement can justify Firefox/WebKit expansion.

[Playwright's first-party `webServer` documentation](https://playwright.dev/docs/test-webserver)
documents starting the tested application as part of a browser-test run.

### Stage 3 outputs

- working Vitest configuration;
- one real RTL component test;
- Storybook browser-test integration;
- accessibility integration;
- Playwright smoke infrastructure;
- Chromium test dependency.

### Stage 3 acceptance criteria

- at least one real fast test is discovered and runs;
- at least one story is converted into a browser test;
- accessibility checks execute against rendered DOM;
- an intentionally broken accessibility fixture can demonstrate the gate fails;
- Playwright can launch Chromium;
- no configured testing layer succeeds solely because zero tests were discovered.

---

## 8. Stage 4 — Integration + Golden Path

### Goal

Prove for the first time that the independently configured web, shared-UI, and
Storybook subsystems actually work together through the same public export and
shared styling contract.

This is the central Phase 2 integration milestone.

---

## 8.1 Establish one complete vertical technical path

Use the representative primitive through the entire architecture:

```text
shadcn / Base UI source
          ↓
@synapcity/ui-core
          ↓
public package export
          ↓
shared CSS + Tailwind
          ↓
     ┌────┴────┐
     ↓         ↓
apps/web   apps/storybook
     ↓         ↓
 browser     browser
```

---

### 8.2 Integrate `ui-core` into `apps/web`

`apps/web` must:

- declare `@synapcity/ui-core` as a workspace dependency;
- import it through its public export;
- load the required shared styles;
- correctly process Tailwind utilities originating from the shared package;
- render the representative Button.

No deep imports are permitted.

---

### 8.3 Integrate `ui-core` into Storybook

`apps/storybook` must independently:

- declare `@synapcity/ui-core`;
- discover the component-owned Button story;
- load the same shared presentation semantics;
- render the component correctly;
- execute its browser test;
- execute its accessibility test.

---

### 8.4 Prove package boundaries

Required graph:

```text
apps/web -----------> @synapcity/ui-core
apps/storybook -----> @synapcity/ui-core

@synapcity/ui-core -X-> apps/web
@synapcity/ui-core -X-> apps/storybook

apps/web -X-> apps/storybook
apps/storybook -X-> apps/web
```

Required negative cases should be represented by safe boundary fixtures/probes rather than intentionally corrupting production source.

At minimum prove:

```text
app → package public export       PASS
app → package deep/private path   FAIL
app → app                         FAIL
package → app                     FAIL
ui-core → React/web               PASS
ui-core → Next                    FAIL
```

---

### 8.5 Run the first true application smoke

The Playwright smoke path should verify something equivalent to:

```text
production-capable web runtime starts
        ↓
browser visits /
        ↓
page renders
        ↓
ui-core Button is present
        ↓
basic interaction succeeds
```

This test proves substantially more than a framework-generated homepage.

It demonstrates:

```text
Next
+ workspace resolution
+ ui-core
+ shared styles
+ browser runtime
```

working together.

---

### 8.6 Build both artifacts locally

Prove:

```text
apps/web
→ production build

apps/storybook
→ static production Storybook build
```

before introducing CI.

---

### 8.7 Configuration extraction checkpoint

Only now evaluate reusable development configuration.

Compare the real configuration used by:

```text
apps/web
apps/storybook
packages/ui/core
```

For each potential extraction ask:

1. Are there at least two genuine consumers?
2. Is the duplicated content policy rather than consumer-specific setup?
3. Does it have one coherent ownership boundary?
4. Does extraction make configuration easier to understand?
5. Does it pass the package-creation checklist?

Potential packages:

```text
@synapcity/dev-typescript-config
@synapcity/dev-eslint-config
@synapcity/dev-vitest-config
```

These are **candidates, not required outputs**.

If the evidence does not justify extraction, keep configuration local/root-owned and document the decision.

Do not extract:

```text
tailwind-config
storybook-utils
test-utils
```

without equivalent demonstrated need.

---

### Stage 4 outputs

A complete technical golden path:

```text
Button
├── exported from ui-core
├── rendered in web
├── rendered in Storybook
├── unit/component tested
├── browser-story tested
├── axe tested
└── included in web smoke test
```

plus:

- both production builds;
- validated dependency graph;
- completed config-extraction review.

### Stage 4 acceptance criteria

The entire local architecture works before CI exists.

No acceptance criterion may depend on GitHub Actions or Vercel to prove basic correctness.

---

## 9. Stage 5 — Verification Contract

### Goal

Turn the working local architecture into a deterministic repository correctness contract.

Primary public command:

```text
pnpm verify
```

The meaning is:

> Given a correctly provisioned checkout, does this repository satisfy every currently required Phase 2 correctness gate?

---

### 9.1 Define workspace task graph

Turbo should orchestrate dependency-aware workspace work.

Expected task families:

```text
build
lint
typecheck
test
```

and any browser/Storybook tasks that benefit from workspace orchestration.

Root scripts remain the human/agent-facing contract.

---

### 9.2 Preserve fast development commands

Do not make normal development require the entire verification suite.

Example command semantics:

```text
pnpm test
→ fast Vitest tests

pnpm test:storybook
→ browser story + accessibility tests

pnpm test:smoke
→ application Playwright smoke

pnpm verify
→ all required correctness gates
```

---

### 9.3 Expand `pnpm verify`

The completed Phase 2 contract should cover the equivalent of:

```text
format:check
lint
typecheck
unit/component tests
dependency hygiene
dependency boundaries
documentation checks
web production build
Storybook production build
Storybook browser tests
accessibility tests
application smoke test
```

Exact script composition may be optimized, but not at the cost of semantic coverage.

---

### 9.4 Eliminate false-green gates

A configured required layer with zero discovered evidence is a failure condition.

Phase 2 must prove:

| Layer | Required non-zero evidence |
| --- | --- |
| ESLint | real TSX inspected |
| TypeScript | real app/package source checked |
| Vitest | real tests discovered |
| dependency-cruiser | real app/package modules inspected |
| Storybook | real story discovered |
| Storybook browser tests | real story executed |
| a11y | rendered story checked |
| Playwright | real smoke executed |
| Build | real web artifact |
| Build | real Storybook artifact |

Do not accept:

```text
0 tests
0 modules
0 stories
No projects matched
```

as successful Phase 2 evidence for a layer that Phase 2 claims to have established.

---

### 9.5 Verify the fresh-checkout path

Before CI configuration, test the documented golden path from a clean checkout-equivalent state:

```text
install exact runtime
        ↓
pnpm install --frozen-lockfile
        ↓
install required Chromium binary
        ↓
pnpm verify
        ↓
PASS
```

No undocumented local machine state may be required.

---

### 9.6 Record task-orchestration / verification decision

Durable architecture should capture:

- pnpm owns workspace/dependencies;
- Turbo owns task orchestration;
- `pnpm verify` is canonical;
- CI invokes rather than redefines the contract;
- required verification layers cannot silently false-green.

### Stage 5 acceptance criteria

- `pnpm verify` passes locally from the documented environment.
- intentionally breaking each critical boundary/test can make the relevant gate fail;
- restoring the repository returns the gate to green;
- no CI-specific behavior is necessary for local correctness.

---

## 10. Stage 6 — CI + Deployment

### Goal

Automate the already-working local contract and prove both deployable artifacts.

Architecture:

```text
                 Git repository
                       │
            ┌──────────┴──────────┐
            ↓                     ↓
     GitHub Actions             Vercel
            ↓                     ↓
      pnpm verify         ┌───────┴───────┐
                          ↓               ↓
                     apps/web      apps/storybook
```

---

### 10.1 GitHub Actions

Create the repository correctness workflow.

Conceptual job:

```text
checkout
↓
Node 24
↓
pnpm 10.24.0
↓
dependency cache
↓
pnpm install --frozen-lockfile
↓
install Chromium + OS dependencies
↓
pnpm verify
```

[GitHub's first-party dependency-caching guidance](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
documents package-manager dependency caching in GitHub Actions.

For Phase 2, run the full contract.

Do not introduce affected-only CI before there is evidence full verification is too expensive.

---

### 10.2 Browser setup in CI

Install only the browser Phase 2 actually requires:

```text
Chromium
```

with its system dependencies.

[Playwright's first-party CI guidance](https://playwright.dev/docs/ci)
documents installing browser system dependencies and configuring an initial CI
worker strategy.

---

### 10.3 Preserve one CI truth

GitHub Actions should primarily execute:

```text
pnpm verify
```

Do not independently reconstruct a second set of correctness rules in workflow YAML.

Workflow-specific steps should be limited to environment provisioning and artifact/report handling.

---

### 10.4 Create two Vercel projects

After explicit authorization for external-state changes:

```text
Vercel project 1
→ apps/web

Vercel project 2
→ apps/storybook
```

[Vercel's first-party monorepo guidance](https://vercel.com/docs/monorepos)
documents multiple projects connected to one repository with separate root
directories and deployment lifecycles.

No npm publishing of `ui-core` is required.

Both deployments consume the workspace package directly.

---

### 10.5 Validate deployment dependency behavior

Test:

#### Web-only change

Expected:

```text
apps/web changed
→ web affected
```

#### Storybook-only change

Expected:

```text
apps/storybook changed
→ Storybook affected
```

#### Shared UI change

Expected:

```text
packages/ui/core changed
→ web affected
→ Storybook affected
```

Workspace dependencies must be explicitly represented in manifests so deployment
systems can understand the graph. [Vercel's monorepo guidance](https://vercel.com/docs/monorepos)
documents dependency-aware builds and skipping unaffected projects.

Do not add custom ignored-build logic until native behavior proves insufficient.

---

### 10.6 Preview deployments

A Phase 2 PR should eventually produce:

```text
GitHub CI
→ correctness status

Vercel web
→ preview artifact

Vercel Storybook
→ preview artifact
```

The two preview URLs provide deployability evidence independently of CI.

---

### 10.7 Production deployment

From `main`:

```text
web
→ production deployment

storybook
→ production deployment
```

Production naming, domains, and access policy can be decided when the projects are created.

They are deployment configuration decisions, not package architecture.

---

### 10.8 Record deployment architecture

The durable decision should establish:

```text
GitHub Actions
→ repository correctness

Vercel
→ deployability / previews / production hosting

apps/web
→ independent deployable artifact

apps/storybook
→ independent deployable artifact
```

Do not couple Storybook to the web application's route tree.

---

## 11. Likely target repository shape at Phase 2 exit

Exact incidental framework-generated files may differ, but the architectural shape should approximate:

```text
.
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── public/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── storybook/
│       ├── .storybook/
│       │   ├── main.ts
│       │   ├── preview.ts
│       │   └── vitest.setup.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── dev/
│   │   └── README.md
│   ├── shared/
│   │   └── README.md
│   ├── domain/
│   │   └── README.md
│   └── ui/
│       └── core/
│           ├── src/
│           │   ├── components/
│           │   │   └── button/
│           │   ├── styles/
│           │   └── index.ts
│           ├── package.json
│           └── tsconfig.json
│
├── tests/
│   └── ...
│
├── turbo.json
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

If the Stage 4 config-extraction checkpoint earns reusable development packages, `packages/dev/*` may gain them.

Their existence is not a prerequisite for Phase 2 success.

---

## 12. Proposed ADR set

Prefer decision cohesion over one ADR per library.

A reasonable Phase 2 set is:

### A. Application Runtime

Records:

- Node;
- Next;
- React;
- App Router;
- server/client ownership;
- framework boundary;
- version policy.

### B. UI and Styling Foundation

Records:

- `@synapcity/ui-core`;
- React/web presentation ownership;
- Tailwind v4 CSS-first;
- semantic CSS ownership;
- shadcn source-acquisition model;
- Base UI;
- rejection of speculative UI layering.

### C. Storybook Surface

Records:

- independent `apps/storybook`;
- Vite/Next Storybook integration;
- component-owned stories;
- independent build/deployment purpose.

### D. Task Orchestration and Verification

Records:

- pnpm/Turbo responsibility split;
- canonical `pnpm verify`;
- non-zero evidence policy;
- fresh-checkout verification requirement.

### E. Deployment Topology

Records:

- GitHub Actions vs Vercel responsibility;
- two Vercel projects;
- preview/production topology;
- workspace/shared-package propagation.

Existing ADR-0007 may be amended as necessary for concrete testing details rather than duplicating its already accepted general testing strategy.

---

## 13. Recommended implementation/commit sequence

Keep changes reviewable.

### Slice 1 — Decision evidence

- resolve exact versions;
- write/approve required upstream ADRs;
- no scaffolding yet.

### Slice 2 — Workspace/runtime

- Turbo;
- Next app;
- TypeScript;
- ESLint;
- baseline build/tasks.

### Slice 3 — UI/Storybook

- `ui-core`;
- Tailwind;
- shadcn/Base UI;
- Button;
- Storybook application.

### Slice 4 — Testing foundation

- Vitest;
- RTL;
- Storybook browser testing;
- accessibility;
- Playwright infrastructure.

### Slice 5 — Golden-path integration

- web consumes Button;
- Storybook consumes same package;
- styling works in both;
- package exports validated;
- smoke works;
- both builds work;
- config-extraction checkpoint performed.

### Slice 6 — Verification contract

- final Turbo graph;
- final root scripts;
- non-zero evidence protection;
- fresh-checkout proof;
- `pnpm verify`.

### Slice 7 — CI

- GitHub workflow;
- Chromium provisioning;
- full required verification.

### Slice 8 — Deployment

After explicit external-state authorization:

- web Vercel project;
- Storybook Vercel project;
- preview verification;
- production verification.

---

## 14. Phase 2 exit criteria

Phase 2 is complete only when all of the following are true.

### Workspace

- pnpm workspace is reproducible.
- Turbo task graph works.
- workspace dependencies are explicit.

#### Web

- Next application starts.
- Next production build succeeds.
- real TSX is linted/typechecked.

#### UI

- `@synapcity/ui-core` exists.
- public exports work.
- no application-runtime dependency leaks exist.
- one real representative primitive exists.

#### Storybook

- independent app runs.
- real story is discovered.
- production Storybook builds.

#### Styling

- Tailwind works in the Next application.
- Tailwind works through Storybook's Vite runtime.
- shared UI semantics render consistently in both.

#### Testing

- real Vitest test executes.
- Storybook browser test executes.
- axe accessibility check executes.
- application Playwright smoke executes.

#### Architecture

- app → package public import succeeds;
- deep import fails policy;
- app → app fails policy;
- package → app fails policy;
- UI → React succeeds;
- UI → Next fails.

#### Verification

- no required gate false-greens with zero evidence;
- `pnpm verify` passes;
- fresh-checkout golden path passes.

#### CI

- PR correctness workflow passes.

#### Deployment

- web preview deploys;
- Storybook preview deploys;
- web production artifact deploys;
- Storybook production artifact deploys.

---

## 15. Explicit Phase 2 non-goals

Phase 2 ends **before** implementing:

- application shell;
- workspace/navigation UI;
- Documents;
- Lexical;
- CRUD;
- persistence;
- database;
- APIs;
- authentication;
- product state;
- Zustand;
- dashboards;
- widgets;
- dynamic theme editor/system;
- desktop;
- mobile;
- docs/blog platform.

Those belong to later architecture/product phases.

---

## 16. Phase 2 completion statement

Successful completion should allow the repository to make the following claim:

> Synapcity now has a reproducible, boundary-enforced, tested, accessibility-checked, independently deployable web/UI technical foundation whose local verification contract is automated by CI and proven through two real deployment artifacts.

Only after that claim is supported by evidence should Phase 3 begin application architecture and the first product vertical slice.
