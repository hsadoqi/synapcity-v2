# Phase 2 — Technical Foundation

**Status:** Proposed — awaiting repository-owner review  
**Date:** 2026-09-27  
**Owner:** Repository owner  
**Question:** Can we trust the technical foundation and monorepo?  
**Source:** Phase 2 architectural discovery and discovery reconciliation; current upstream evidence checked on 2026-09-27  
**Related:** [Product foundation](../../../PRODUCT.md), [architecture principles](../principles.md), [ADR index](../decisions/README.md), [Definition of Done](../../engineering/definition-of-done.md), [discovery ledger](../../discovery/phase-02-ledger.md)

## Authority and approval boundary

This document is a design proposal for review. It records the Phase 2 direction precisely enough to evaluate and later plan, but it does not authorize implementation by its existence.

- It does not amend an accepted ADR.
- It does not install or approve a dependency version.
- It does not create an application, package, deployment, route, schema, API, state boundary, or persisted identifier.
- It does not make an entry in `docs/discovery/` a requirement.
- The repository owner must explicitly accept this design, and consequential technology/topology decisions must then be recorded through the ADR process before implementation where `AGENTS.md` requires one.

This document uses working implementation labels such as `web`, `storybook`, and `ui`. They identify proposed technical workspaces only. They do not adopt product terminology or name product concepts.

## 1. Purpose

Phase 1 answered:

> Can we trust the repository?

Phase 2 answers:

> **Can we trust the technical foundation and monorepo?**

Phase 2 should turn the governed Phase 1 repository into a production-grade executable, testable, buildable, deployable engineering environment—without prematurely designing Synapcity's application/product architecture.

It establishes the smallest technical foundation and monorepo bootstrap capable of accepting later Synapcity product work. The phase proves application runtime, shared UI consumption, styling, component development, testing, accessibility, task orchestration, production builds, CI, and preview deployment without building the Synapcity application shell, implementing a product capability, or resolving the product and application-architecture decisions that remain open.

The deliverable is not a Button, a Storybook, or a Next.js page in isolation. The deliverable is a trustworthy path through the technical foundation:

```text
foundational styles and tokens
              |
              v
       shared UI primitive
        /       |       \
       v        v        v
component test  story  public export
                         /        \
                        v          v
                  web application  Storybook surface
                        |          |
                        v          v
                  production builds
                        |
                        v
                 canonical verification
                        |
                        v
                 CI and PR previews
```

## 2. Entry criteria

Phase 2 starts from the accepted Phase 1 foundation:

1. Node and pnpm are pinned and a frozen install is reproducible.
2. The pnpm workspace globs and `@synapcity/*` naming convention exist.
3. Package categories, dependency direction, and public-export rules are accepted.
4. TypeScript, ESLint, Prettier, Vitest, Knip, dependency-cruiser, and documentation checks run through the root scripts.
5. `pnpm verify` is the canonical human/agent-facing repository correctness command and CI runs the same command.
6. Required tests fail when no tests are discovered.
7. Documentation governance, approval gates, preservation rules, and agent workflows remain in force.

Phase 2 does not reinterpret a passing Phase 1 gate as product evidence. Before Phase 2, production source does not exist, and the existing build and boundary passes have limited real-workspace evidence.

## 3. Scope

### In scope

- The first product-runtime application surface.
- A thin, independently deployable Storybook/UI-system surface.
- One deliberately small shared UI package boundary.
- A CSS-first Tailwind styling foundation shared by both surfaces.
- A minimal semantic-token and global-style contract owned initially with UI.
- One representative shadcn-derived primitive as an integration probe.
- React/Next.js runtime-coupling rules.
- Workspace dependency/version/configuration ownership.
- Turborepo task orchestration underneath canonical pnpm commands.
- App/package component testing, Storybook verification, accessibility checks, and a small browser integration smoke path.
- Real production builds for both deployable surfaces.
- GitHub CI integration and two independent Vercel preview deployments.
- Fresh-checkout documentation and safe, selected negative-path verification.

### Non-goals

Phase 2 does not implement or decide:

- the Phase 3 application shell, navigation, sidebar, rail, workspace switcher, command surface, or product routes;
- Documents behavior, Lexical integration, document schema, CRUD, persistence, autosave, or relationships;
- Dashboards, React Grid Layout integration, widget lifecycle, widget data sources, or dashboard persistence;
- database, storage, API style, authentication, authorization, queues, caching, or server-state architecture;
- Zustand or any product-state/store topology;
- a dynamic theme product, Theme Studio, palette generation, scoped themes, presets, user customization, or theme persistence;
- a broad component library or predicted inventory of primitives;
- a universal web/native UI library;
- docs/blog, desktop, or mobile applications;
- generic runtime, adapter, test-utility, Storybook-utility, Tailwind-config, or design-token packages without demonstrated consumers;
- remote-cache rollout or custom affected/deployment filtering as an exit requirement;
- dependency upgrades unrelated to an independently approved Phase 2 dependency decision.

## 4. Proposed initial topology

The logical Phase 2 topology is:

```text
apps/
|-- web/
`-- storybook/

shared UI package
`-- components, styles, tests, and stories
```

The intended dependency direction is:

```text
apps/web -----------> shared UI package <----------- apps/storybook

shared UI package -X-> either application
```

### 4.1 Initial UI path (settled)

The repository owner has settled the physical-path question raised by the discovery shorthand `packages/ui`. The approved initial shared UI boundary is:

```text
packages/ui/core
@synapcity/frontend-uiontend-ui-core
```

This follows ADR-0007's category-qualified naming (`packages/<category>/<name>` → `@synapcity/<category>-<name>`), amended during the Phase 2 architecture reconciliation. It is intentionally a single consolidated initial UI package: `@synapcity/frontend-uiontend-ui-core` does not approve a future hierarchy such as `ui-core` → `ui-shadcn` → `ui-components` (see §6.3). This design uses **shared UI package** where the discussion is not about the specific path or name.

### 4.2 `apps/web`

`apps/web` is proposed as the application composition root. It owns:

- the selected application framework and its configuration;
- App Router layouts/pages and application metadata if Next.js is accepted;
- framework-specific navigation, request, cookie, environment, and future server integration;
- the global application composition point;
- consumption of the shared UI public API and styling entry points;
- a deliberately minimal platform-verification page;
- its own tests and production build.

It does not own reusable UI primitives merely because it consumes them.

### 4.3 `apps/storybook`

`apps/storybook` is proposed as a thin runtime/aggregator for the shared UI system and an independently deployable portfolio surface. It owns:

- Storybook framework/builder/runtime configuration;
- story discovery;
- global preview configuration, decorators, and shared CSS loading;
- Storybook-specific accessibility/testing integration;
- Storybook build and deployment configuration.

It does not own shared components, component stories, or component tests. Those remain colocated with the component owner. Storybook may later present a richer Synapcity UI system, but Phase 2 proves only the surface and its ownership model.

Its first-class application status is justified by the **independent artifact principle** surfaced during discovery: an application workspace may be warranted when it has an independent audience, deployment lifecycle, or development purpose. Separating configuration for tidiness alone is not sufficient. Storybook remains the initial development/documentation/showcase runtime for the UI system, not the architectural identity or permanent name of that system.

### 4.4 Shared UI package

The shared UI package owns reusable web presentation primitives and the minimum styling foundation required to render them consistently. It may own:

- React components and their public exports;
- HTML/CSS and web-platform behavior intrinsic to reusable components;
- client behavior intrinsic to a reusable interactive component;
- foundational styles and a small semantic token mechanism;
- colocated component tests and stories;
- minimal utilities directly required by the owned components.

It must not own:

- product semantics or feature behavior;
- application routing, navigation decisions, request/cookie APIs, or Server Actions;
- product state, data access, persistence, or authentication;
- Next.js-specific coupling added only to satisfy `apps/web`;
- Storybook application internals.

Cross-workspace consumers use only the package's declared `exports`, preserving ADR-0005.

## 5. Application canvas, not application shell

Phase 2 produces a minimal verification surface on a production-ready application canvas. It establishes only the mechanics Phase 3 should be able to build on:

- root document and layout structure;
- font loading and typography baseline;
- global CSS entry and ownership;
- foundational semantic CSS variables/tokens;
- canvas/background/foreground and minimum surface/border/primary semantics required by the representative primitive;
- root/viewport sizing and base element behavior;
- visible focus and reduced-motion baselines;
- minimal metadata and error/not-found boundaries only where the chosen framework's current guidance and the verification surface require them;
- a clean composition point for Phase 3.

The rendered page may contain only a truthful heading, a platform-verification statement, and the representative shared primitive. It must not add fake product content, placeholder product routes, speculative providers, or empty shell abstractions.

## 6. Styling and shared UI

### 6.1 Tailwind is CSS-first

If Tailwind CSS v4 is selected during the approved dependency-resolution step, Phase 2 uses its CSS-first model:

- theme variables that should generate utility APIs use `@theme`;
- ordinary runtime/semantic variables that should not create utilities remain ordinary CSS variables;
- shared theme CSS is imported by both application surfaces;
- a legacy JavaScript `tailwind.config.*` abstraction is not introduced without a demonstrated need.

This is upstream guidance, not an adopted dependency version. Tailwind is not currently declared in this repository, so implementation must still select and approve the version from current first-party evidence.

### 6.2 Initial ownership with an extraction seam

Foundational style/token source is initially owned with the shared UI package because the two real Phase 2 surfaces consume UI and need one rendering contract. The files should make the conceptual split between theme variables and global/base styles clear, but the design does not mandate exact filenames.

An independently versioned design-token/style package is deferred. Extraction becomes eligible when a real consumer needs tokens/styles independently of UI components, ownership or dependency direction diverges, or independent verification justifies the boundary.

### 6.3 shadcn is source acquisition

shadcn is a way to acquire and adapt source, not a runtime or architecture layer. After acquisition, Synapcity owns the component source, tests, accessibility behavior, public API, and maintenance.

`@synapcity/frontend-uiontend-ui-core` (§4.1) is the approved name of the single consolidated initial UI boundary. That name does not approve a speculative ancestry or layering model such as `ui-core` → `ui-shadcn` → `ui-components`, or any equivalent tiering. Phase 2 must not create such layers. It adds only one representative primitive—likely a Button, with the exact selection confirmed during planning—to prove the full integration path, inside the one approved package. Additional primitives must be pulled by Phase 3 requirements.

If the shadcn CLI is used, its workspace configuration and aliases must align with the accepted package layout and public exports. Current upstream monorepo examples are evidence, not permission to replace Synapcity's topology with the example topology.

## 7. Framework and runtime coupling

### 7.1 Proposed web framework direction

The discovery direction is Next.js App Router with React, subject to explicit architecture/dependency approval and implementation-time version selection. No Next.js or React version is currently declared, and this specification does not choose one.

If accepted:

- layouts and pages remain Server Components by default;
- a client boundary is introduced only where state, effects, event handling, browser APIs, or client hooks require it;
- `'use client'` is placed at the narrow reusable entry point that needs it, not preemptively at the root;
- providers are introduced only for a demonstrated requirement and placed as deep as practical;
- the UI package may contain `'use client'` for behavior intrinsic to reusable web UI;
- Next.js APIs and application composition remain owned by `apps/web`.

### 7.2 Runtime semantics (settled)

ADR-0007 previously said that packages are "runtime-agnostic" and receive runtime-specific capabilities through interfaces implemented in an app. The repository owner has settled this: ADR-0005 and ADR-0007 were amended during the Phase 2 architecture reconciliation to an ownership-sensitive runtime model instead of that blanket rule.

- `domain` packages remain portable and runtime-neutral: no React, React DOM, browser/DOM APIs, Next.js, application routing, or application-runtime integration.
- `ui` packages are application-runtime agnostic but may use React, React DOM, JSX, and DOM/browser/web-platform capabilities intrinsic to reusable presentation, including a narrow `"use client"` boundary where intrinsic reusable behavior requires it. They must not acquire Next.js routing, request APIs, Server Actions, app-specific environment integration, or application composition.
- Applications own framework/application-runtime composition.

This confirms the shared UI package may be **application-runtime agnostic** but explicitly React + web, using browser behavior intrinsic to a reusable component, without a further ADR gate before its creation. It does not authorize creating the package itself — that remains gated on the approvals in §11 and §5 of `AGENTS.md`.

### 7.3 No generic runtime package now

Phase 2 preserves a future runtime-integration seam but does not instantiate a generic `runtime/` folder or package category.

A future shared capability may eventually need:

```text
portable capability -> React/web integration -> application runtime
```

That boundary is revisited only when integration logic duplicates across real consumers, one capability needs multiple runtime implementations, or runtime-specific dependencies begin contaminating a portable package. The future form—category, adapter package, capability-specific binding, subpath export, or something else—remains undecided.

## 8. Dependency and configuration philosophy

Phase 2 adopts this proposed rule:

> **Centralize versions, localize ownership, and share configuration only where configuration is genuinely shared.**

These are separate questions:

1. **Version authority:** Where is the allowed version range controlled?
2. **Dependency ownership:** Which workspace actually uses and must declare the dependency?
3. **Configuration ownership:** Is policy repository-wide, environment-specific, or workspace-specific?

### 8.1 pnpm workspace and catalogs

The repository remains on its pinned pnpm 10.24.0 unless a separately approved upgrade changes it. pnpm 10 documentation confirms that catalogs can centralize dependency ranges while individual workspace manifests declare their actual dependencies.

Phase 2 should evaluate a default catalog in `pnpm-workspace.yaml` for dependencies used by multiple workspaces, including compatible React-family and testing/tooling versions. Catalog adoption must preserve explicit workspace declarations and must not become an opportunistic pnpm upgrade.

Internal workspace dependencies should use the `workspace:` protocol so pnpm refuses to substitute a registry package when the local package is absent or incompatible.

### 8.2 Root/global tooling versus workspace capabilities

- Repository-wide tools and policies—such as Prettier, dependency-cruiser, Knip, documentation checks, and repository orchestration—remain root-owned unless a real second configuration owner appears.
- Frameworks and capabilities are declared by the workspaces that use them: for example, Next.js by `apps/web`, Storybook by `apps/storybook`, and component-testing dependencies by the workspace whose tests require them.
- A dependency being catalog-versioned does not make it root-owned.
- Hoisting or incidental root availability is not a substitute for a workspace declaration.

### 8.3 TypeScript, Vitest, and Prettier configuration

- **TypeScript:** preserve the root baseline, then add only the environment profiles real Phase 2 workspaces require. Whether those profiles remain root files or earn a `dev` configuration package is an implementation-design question; a package is not created merely because inheritance exists.
- **Vitest:** keep root-level orchestration/global policy and use Vitest 5's `test.projects` model for materially different workspace environments. Workspace-local configuration exists only where behavior differs. The deprecated `workspace` configuration name must not be newly adopted.
- **Prettier:** retain one root version and one root formatting policy. No `prettier-config` package is justified in Phase 2.
- **Shared config/test utilities:** require at least two concrete consumers with a coherent shared capability, or an accepted boundary that requires isolation. Small duplication alone is not enough.

## 9. pnpm and Turborepo ownership

The ownership split is:

> **pnpm owns the workspace/dependency graph. Turborepo owns the task graph.**

Workspace manifests declare the capabilities their workspace can run. Turborepo composes those scripts using the package graph; it does not replace Next.js, Storybook, Vitest, TypeScript, or pnpm.

Initial task vocabulary should remain small and evidence-driven, centered on `dev`, `build`, `typecheck`, and `test`, plus only existing repository checks that genuinely benefit from workspace orchestration.

The approved implementation must configure and verify:

- dependency-aware task order rather than directory-changing shell scripts;
- accurate `dependsOn` relationships;
- actual file outputs for cacheable build tasks;
- no declared output where a task emits none;
- long-running development tasks as persistent and non-cacheable;
- environment variables as task inputs when they affect output;
- propagation from a shared UI change to both consuming application builds;
- local caching correctness before any remote-cache optimization.

Remote caching, custom cache services, and aggressive affected-task optimization are not Phase 2 exit requirements.

## 10. Canonical verification contract

`pnpm verify` remains the human/agent-facing answer to:

> Is the Synapcity repository healthy?

Turborepo may orchestrate workspace-aware portions underneath that command. It must not become a second public correctness contract that requires people or agents to remember a sequence of Turbo commands.

Conceptually:

```text
pnpm verify
|-- repository-owned gates
|   |-- format
|   |-- lint/static analysis
|   |-- dependency and architecture checks
|   `-- documentation checks
`-- Turbo-orchestrated workspace gates
    |-- type checking
    |-- unit/component tests
    `-- production builds
```

The exact composition and cost boundary between local `pnpm verify`, CI-only browser checks, and deployment checks is decided during implementation planning. Whatever is called required must fail when its evidence is absent.

## 11. Testing by ownership and failure mode

Verification uses the lowest-cost environment that can faithfully verify the claim. Higher layers verify integration seams rather than repeating component assertions.

| Layer | Question it owns |
| --- | --- |
| TypeScript, lint, and dependency boundaries | Is code structurally valid and does it respect ownership/runtime rules? |
| Vitest + Testing Library | Does a component or local unit behave correctly in isolation? |
| Colocated Storybook story | Can representative component states be rendered, inspected, and communicated independently? |
| Automated accessibility checks | Does rendered UI satisfy the automatable accessibility invariants selected for that environment? |
| Browser smoke | Do the assembled app, shared styles, and shared component work together in a real browser? |
| Production build | Can each deployable artifact compile with production settings? |
| Preview deployment | Does each artifact build and run in the actual hosting environment? |

Tests and stories stay with the capability they describe. The Storybook app discovers them; it does not own them.

Required projects must not false-green. If UI tests, app tests, Storybook checks, or browser smoke tests are required, discovery of zero required tests/stories is a failure or an explicitly reported NOT VERIFIED state—not success.

Accessibility evidence is layered: semantic HTML, keyboard behavior, visible focus, reduced-motion behavior, and labels remain human engineering responsibilities; axe-based automation catches only a subset and cannot establish full accessibility.

## 12. CI and deployment authority

### 12.1 GitHub CI

GitHub CI remains authoritative for repository correctness. A pull request must run the canonical verification path, and every required failure must make the relevant job fail. Turborepo may improve workspace-aware orchestration but does not narrow the accepted Phase 1 gates.

Server-side branch protection remains a known limitation until repository settings change. Phase 2 must report whether required checks are conventionally required or technically enforced.

### 12.2 Vercel previews

Phase 2 proposes two Vercel projects connected to the same repository:

```text
web project        -> apps/web
UI/Storybook project -> apps/storybook
```

Each pull request must be capable of producing an independently working preview when the project is affected. A shared UI change should affect both consumers because workspace dependencies are explicit.

Vercel is authoritative for the narrower question:

> Can this artifact deploy in its configured hosting environment?

A green Vercel deployment does not replace `pnpm verify`, and green CI does not prove the external deployment configuration works.

Use Vercel's supported monorepo behavior first. Do not build custom skip/filter logic unless default dependency-aware behavior proves inadequate.

## 13. Implementation order after approval

This is a dependency order, not an issue list:

1. Record the required Phase 2 ADRs and approval-sensitive technical choices (the physical shared-UI package path, `packages/ui/core` / `@synapcity/frontend-uiontend-ui-core`, is already settled; see §4.1).
2. Select compatible dependency versions from current first-party evidence without unrelated upgrades.
3. Establish dependency/version/configuration ownership and the minimum shared TypeScript/testing profiles.
4. Add Turborepo and define the small task graph.
5. Create the shared UI and CSS/token foundation.
6. Add the representative shadcn-derived primitive, colocated test, story, and public export.
7. Create the minimal web application canvas and consume the primitive.
8. Create the thin Storybook surface, discover the colocated story, and consume the same styling.
9. Integrate accessibility and browser seam verification.
10. Make both production builds part of canonical orchestration.
11. Extend CI and prove required failure behavior.
12. Configure and verify the two preview deployments.
13. Run the fresh-checkout golden path and Phase 2 exit audit.

No GitHub issues should be derived until the repository owner accepts the design and the approval-sensitive choices are recorded.

## 14. Exit criteria and observable evidence

| Exit criterion | Required observable evidence |
| --- | --- |
| Workspace topology | `apps/web`, `apps/storybook`, and the approved shared-UI package path are real pnpm workspaces with unique names and explicit dependency edges. |
| Dependency policy | Shared version ranges have one documented authority; every workspace declares the dependencies it actually uses; internal dependencies use `workspace:`. |
| Tailwind in both apps | A committed shared CSS/token entry renders the intended baseline in web and Storybook production artifacts, not only in development. |
| Shared shadcn UI consumption | The same public export of one Synapcity-owned, shadcn-derived primitive renders in both apps; no app-local duplicate exists. |
| Application canvas | Web has a truthful minimal verification surface, production-ready root styling/layout mechanics, and no Phase 3 shell/product placeholders. |
| Stories/tests colocated | The primitive's implementation, test, and story remain under its owning package; Storybook discovers rather than owns the story. |
| Tests in packages and apps | Real UI-package and web-app tests execute, assert appropriate behavior, and fail when broken. Any required Storybook test path executes against at least one story. |
| No false-green gates | Isolated probes show each required test/story/browser project fails or reports missing evidence when its required files are absent. Probes are removed afterward. |
| Accessibility | The representative primitive passes selected automated checks; keyboard, focus, semantics, and reduced motion are manually assessed and reported. |
| Turbo graph | A graph/run summary shows task edges follow workspace dependencies; a UI change invalidates/executes the UI and both consuming build paths; unrelated work is not falsely claimed as verified. |
| Cache semantics | Build outputs restore correctly on a local cache hit; persistent tasks are not cached; environment-sensitive output changes invalidate the affected task. |
| Production builds | Canonical orchestration produces successful production web and static Storybook artifacts. |
| Browser integration | A real browser loads the web verification surface, shared styles are present, and the representative interaction works; Storybook's representative story is reachable/renderable. |
| CI | A pull request runs the canonical repository gates plus approved Phase 2 gates; an isolated required-gate violation makes CI fail. The actual hosted run is the proof. |
| Independent deployments | The same pull request yields working, independently addressable web and Storybook previews when affected; a shared UI change is recognized as affecting both. |
| Fresh-checkout documentation | A clean checkout can follow committed setup -> install -> develop -> test -> Storybook -> verify -> production builds -> preview review without undocumented machine state. |
| Boundary enforcement | Real-workspace probes demonstrate public-export and category/runtime boundaries, including rejection of a deep import and prohibited framework coupling. |
| Honest report | The final audit states implemented, tested, consumed, exercised, product-required, canonical, and NOT VERIFIED claims separately per the Definition of Done. |

## 15. Golden path

From a fresh checkout on the pinned Node and pnpm versions, committed documentation must lead a developer through:

```text
clone
  -> activate pinned pnpm
  -> frozen install
  -> run the web surface
  -> run the Storybook surface
  -> execute package and app tests
  -> execute the browser seam check
  -> build web and Storybook for production
  -> run pnpm verify
  -> observe green GitHub CI
  -> review both PR previews
```

No step may rely on uncommitted files, global packages beyond documented prerequisites, unstated environment values, or one machine's local configuration.

## 16. Selected negative-path verification

Negative probes must be safe, isolated, reversible, and removed before completion. The Phase 2 audit should select representative probes such as:

- remove or rename the required UI test and confirm the required project does not pass with zero tests;
- introduce a failing component assertion and confirm the relevant local/root/CI gate fails;
- deep-import a non-exported UI module from an app and confirm boundary/resolution checks reject it;
- introduce a prohibited Next.js import into the shared UI package and confirm an automated boundary rejects it;
- break the shared CSS import and confirm a build or browser assertion detects missing styling;
- break the Storybook story glob or remove the required story and confirm the required check detects absence;
- misdeclare a Turbo output or dependency edge and confirm the graph/cache audit detects the error;
- break one production build and confirm both canonical verification and CI surface the failure.

Fixture-only checks must be labeled self-consistent. Real-workspace behavior is the stronger Phase 2 evidence.

## 17. Version-sensitive evidence checked on 2026-09-27

The repository currently pins Node 24.20.0, pnpm 10.24.0, TypeScript `~6.0.3`, and Vitest `^5.0.2`. It does not declare Next.js, React, Tailwind, shadcn, Storybook, Turborepo, Playwright, Testing Library, or axe packages.

| Topic | Current first-party evidence | Design consequence | Still not decided |
| --- | --- | --- | --- |
| pnpm 10 catalogs | [pnpm 10 catalogs](https://pnpm.io/10.x/catalogs) defines reusable version ranges in `pnpm-workspace.yaml` and `catalog:` references in workspace manifests. | Catalogs are compatible with the pinned pnpm line and can separate version authority from dependency ownership. | Which dependencies enter a catalog and whether strict/prefer/manual catalog mode changes. |
| pnpm workspaces | [pnpm 10 workspace docs](https://pnpm.io/10.x/workspaces) says `workspace:` refuses non-local substitution and warns cycles break topological guarantees. | Use explicit internal workspace edges and preserve acyclic dependency direction. | Exact version specifier style beyond requiring local resolution. |
| Tailwind CSS | [Tailwind theme variables](https://tailwindcss.com/docs/theme) defines CSS-first `@theme`, distinguishes ordinary CSS variables, and documents shared theme CSS across projects. | Prefer CSS-first shared styling with an extraction seam if Tailwind v4 is selected. | Tailwind version, token vocabulary, file names, and future token-package extraction. |
| shadcn monorepos | [shadcn monorepo guidance](https://ui.shadcn.com/docs/monorepo) routes components into a shared UI workspace through aliases/exports and leaves the Tailwind config path blank for v4. | Treat the CLI as source acquisition and align it with Synapcity exports/layout. | CLI use versus manual acquisition, component style/base color/icon library, exact `components.json` layout. |
| Next.js/React boundary | [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) keeps layouts/pages server by default and treats `'use client'` as a module-graph boundary. | Keep client boundaries narrow and Next-specific composition in the web app. | Framework/version selection and exact compiler/bundler configuration. |
| Vitest 5 projects | [Vitest test projects](https://vitest.dev/guide/projects) documents `test.projects`, notes `workspace` is deprecated, and says project inheritance defaults on in Vitest 5. | Use projects for distinct app/package environments without a speculative config package. | Exact projects, DOM/browser environment packages, and coverage policy. |
| Storybook | [Storybook story configuration](https://storybook.js.org/docs/9/api/main-config/main-config-stories) explicitly supports colocating stories; [sharing guidance](https://storybook.js.org/docs/sharing) supports static deployment; [accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing) can fail CI when configured as an error. | A thin consumer can discover colocated stories, build independently, and host automatable a11y checks. | Storybook major/framework/builder, exact test integration, and whether Storybook-specific checks belong locally or CI-only. |
| Turborepo | [package/task graph guidance](https://turborepo.dev/docs/core-concepts/package-and-task-graph) derives the package graph from workspace dependencies; [task configuration](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) defines `dependsOn`, outputs, cache, and persistent tasks. | pnpm retains dependency ownership while Turbo composes accurate workspace tasks. | Turbo version, exact task JSON, remote caching, and optimization policy. |
| Vercel monorepos | [Vercel monorepo guidance](https://vercel.com/docs/monorepos) supports multiple projects per repository and dependency-aware skipping when workspaces and manifest edges are explicit. | Two projects can provide independent deployability evidence, and shared UI changes should affect both. | Project names, account/team, access policy, domains, exact build settings, and any remote-cache configuration. |

No dependency version recommendation is made from “latest” documentation alone. Implementation must repeat the repository-version -> current first-party evidence -> accepted Synapcity decision -> conflict check -> approval sequence required by `AGENTS.md` §7a.

## 18. Deliberately open review questions

The physical initial-UI-package path and the ADR-0007 runtime-agnostic question are now settled (§4.1, §7.2) and removed from this list.

1. Does accepting this specification authorize separate proposed ADRs for Next.js/React, Turborepo, Tailwind/shadcn/UI ownership, Storybook, and Vercel topology, or should some be grouped?
2. Which dependency families should use the default pnpm catalog, and should root-only repository tools remain outside it?
3. What minimum TypeScript profiles are genuinely required, and do root files suffice?
4. Which Storybook framework/builder is compatible with the selected React/Next versions and the desired standalone surface?
5. Which accessibility checks are required locally, in CI, or both, without duplicating the same assertion across three layers?
6. Is the browser smoke path inside the canonical local `pnpm verify`, CI-only, or split into a fast local gate and hosted evidence?
7. What Vercel project/access names should be used? “Synapcity UI” remains a portfolio description, not an adopted canonical product name.
8. Which negative probes are safe and proportionate for the final audit?

## 19. Self-review

### Scope leakage

- No shell, feature, product route, backend, persistence, state, advanced theme runtime, or broad component inventory is included.
- Future surfaces influence coupling judgment only; they do not create Phase 2 workspaces.

### Speculative packages

- Only one shared UI boundary is proposed, at the now-settled path `packages/ui/core` (`@synapcity/frontend-uiontend-ui-core`), which does not authorize any future layering (§4.1, §6.3).
- Config, token, runtime, test, Storybook, widget, theme, and native packages remain candidates in the discovery ledger.

### Phase 0/1 consistency

- Product terminology is not inferred from technical workspace names.
- Existing package categories, public-export rules, workspace naming, testing strategy, CI authority, and `pnpm verify` contract are preserved.
- Open storage/API/routing/state/product decisions remain open.

### Observable exit evidence

- Every exit criterion has an artifact, command result, hosted run, browser observation, or explicit NOT VERIFIED state.
- Required verification paths include missing-evidence failure behavior.
- CI and deployment evidence are distinct and neither substitutes for the other.

### Discovery reconciliation

- Phase 2 discovery confirms the proposal's purpose, narrow platform-proof scope, two-surface topology, Storybook ownership model, UI extraction threshold, styling seam, portfolio rationale, portability constraint, and deployment evidence.
- Reconciliation strengthened the rationale for treating Storybook as a first-class application through the independent artifact principle; it did not make the broader UI-system portfolio vision a Phase 2 deliverable.
- `packages/ui` was logical discovery shorthand; the physical-layout and runtime-language questions in sections 4.1 and 7.2 are now settled by owner-approved decisions, not resolved by this proposal itself.
- Future docs, desktop, mobile, theme, widget, testing/configuration, and portability ideas remain non-authoritative discovery entries rather than scope additions.
- Exploratory phase labels and illustrative workstream lists do not govern this proposal. Its stated purpose, boundaries, entry criteria, and exit evidence govern only if the repository owner accepts it.

## 20. Review outcome

The repository owner should record one of these outcomes after review:

- **Accepted for ADR and implementation planning** — architecture decisions may be drafted as proposed ADRs and workstreams/issues derived, still without implementation until their approvals are complete.
- **Revise** — update this proposal; do not derive implementation work.
- **Rejected** — retain as historical proposal and do not implement.
