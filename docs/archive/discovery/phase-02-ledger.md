# Phase 2 discovery ledger

**Status:** Research / evidence — non-authoritative  
**Date initialized:** 2026-09-27  
**Origin:** Phase 2 — Technical Foundation discovery
**Related proposal:** [Phase 2 design specification](../architecture/designs/phase-02-technical-foundation.md)

Nothing in this ledger is a requirement or accepted ADR. Labels are working descriptions unless another authoritative document explicitly adopts them. Package-like labels describe possible ownership boundaries, not approved names or paths.

## 1. Synapcity UI as a first-class portfolio surface

**Status:** Candidate

**Why it matters:** The shared interface system could become an independently demonstrable engineering artifact covering accessible primitives, semantic styling, themes, widgets, interaction states, and design-system communication—not merely an internal Storybook configuration.

**Current-phase impact:** Phase 2 proposes a thin, independently deployable Storybook application so the UI system has a real second consumer and a public-facing growth path. Phase 2 still implements only a minimal proof.

**What is not decided:** A canonical name, public audience, visual identity, long-term documentation technology, component taxonomy, publishing model, or whether the UI system becomes a product in its own right.

**Revisit trigger:** The shared UI inventory or theme/widget work becomes substantial enough to require an explicit audience, information architecture, governance, or release model.

**Architectural implication today:** Keep components, tests, and stories with their owners; keep the Storybook app thin and replaceable; do not equate the UI system with Storybook itself.

## 2. Dedicated docs/blog or engineering-journal application

**Status:** Exploration

**Why it matters:** A separate surface could document the Synapcity journey, architecture, and engineering work while demonstrating technical communication and creating a third web consumer of selected foundations.

**Current-phase impact:** None. It is not a Phase 2 workspace.

**What is not decided:** Whether it will exist, whether it is a blog or documentation system, framework, content source, route/domain, publishing workflow, relationship to Storybook, or which shared UI it consumes.

**Revisit trigger:** Enough durable material exists to justify an intentionally approved public documentation project, or repeated manual publishing creates a concrete need.

**Architectural implication today:** Avoid gratuitous Next.js coupling in genuinely portable shared capabilities, but do not create docs-specific packages, content schemas, or adapters.

## 3. Desktop application

**Status:** Exploration

**Why it matters:** A desktop client could explore filesystem/OS integration, offline or local-first behavior, desktop interaction patterns, and a distinct portfolio competency.

**Current-phase impact:** None.

**What is not decided:** Whether desktop will exist; Electron, Tauri, or another runtime; distribution/signing/update model; offline architecture; web-code reuse; desktop-specific capabilities; or product scope.

**Revisit trigger:** A concrete product capability materially benefits from filesystem, native-shell, offline, background, or other desktop-only behavior, or a dedicated desktop exploration is approved.

**Architectural implication today:** Do not bury portable domain/theme computation in a web framework without reason. Do not create desktop abstractions, adapters, or packages.

## 4. Mobile application

**Status:** Exploration

**Why it matters:** A mobile client could address real mobile use cases and provide experience with React Native or another mobile stack.

**Current-phase impact:** None.

**What is not decided:** Whether mobile will exist; platform/runtime; product scope; navigation; storage/sync; offline model; shared component strategy; or release/distribution.

**Revisit trigger:** Specific mobile workflows or user evidence justify a native/mobile surface, or a separately scoped mobile exploration is approved.

**Architectural implication today:** Preserve inexpensive portability in platform-neutral capabilities; do not require the Phase 2 web UI package to render in React Native.

## 5. Separate web and native UI implementations

**Status:** Deferred

**Why it matters:** Web and native renderers have different styling, accessibility, interaction, and platform models. A future native surface may need its own UI implementation while sharing lower-level contracts or computation.

**Current-phase impact:** None; Phase 2 UI is explicitly React + web.

**What is not decided:** Whether native UI exists, how much API vocabulary is shared, whether tokens are portable, or whether any package sits below both implementations.

**Revisit trigger:** A real native consumer is approved and its required shared capabilities are known.

**Architectural implication today:** Do not promise universal components. Keep portable computation separable when naturally cheap.

## 6. Richer theme capability

**Status:** Deferred

**Why it matters:** Prior exploration surfaced valuable concepts such as OKLCH color work, scales, harmonies, accessible foreground derivation, appearance, presets, theme compilation, scoped themes, runtime application, and user customization.

**Current-phase impact:** Phase 2 creates only foundational CSS/token mechanics sufficient for the integration proof.

**What is not decided:** Theme product scope, user-facing controls, persistence, generation algorithms, semantic vocabulary, scope rules, presets, customization lifecycle, or package topology.

**Revisit trigger:** Phase 3+ requirements need appearance behavior beyond static foundational values, or the UI portfolio surface gains a concrete theme playground requirement.

**Architectural implication today:** Keep foundational style/token files conceptually separable from application composition. Do not rebuild Theme Studio or the previous implementation's theme architecture.

## 7. Framework-neutral theme kernel

**Status:** Candidate

**Why it matters:** Pure theme parsing, validation, color math, compilation, or derivation may eventually have consumers beyond React/web and may deserve independent verification.

**Current-phase impact:** None beyond avoiding unnecessary framework imports in any genuinely pure computation that happens to emerge.

**What is not decided:** Whether a kernel is needed, its data model, public API, package name/path, algorithms, outputs, persistence, or supported runtimes.

**Revisit trigger:** Substantial pure theme logic appears, at least two runtime consumers need it, or framework coupling obstructs independent testing or reuse.

**Architectural implication today:** Do not create `theme`, `theme-core`, or equivalent merely to reserve the boundary.

## 8. React theme integration (`theme-react` working label)

**Status:** Deferred

**Why it matters:** A substantial theme capability may need React-specific context, hooks, scoped application, hydration, or subscription behavior separate from pure computation.

**Current-phase impact:** None. Phase 2 introduces no generic theme provider.

**What is not decided:** Whether React integration needs a separate package, subpath, colocated module, or app-owned adapter; its API; provider shape; or server/client behavior.

**Revisit trigger:** Real React integration becomes coherent, substantial, and independently owned, or multiple React consumers duplicate it.

**Architectural implication today:** Add client boundaries/providers only for demonstrated Phase 2 component needs; do not pre-create `theme-react`.

## 9. Design-token or shared-style package extraction

**Status:** Candidate

**Why it matters:** A future docs app, UI surface, or native-adjacent tooling may need tokens/styles independently of reusable components. Separate ownership could also enable independent verification or publication.

**Current-phase impact:** Phase 2 keeps the initial CSS/token contract with shared UI while preserving a clear extraction seam.

**What is not decided:** Package existence, name, format, token vocabulary, versioning, publication, whether base styles accompany tokens, or how non-web consumers participate.

**Revisit trigger:** A real consumer needs tokens/styles without UI components, token ownership diverges, publication becomes necessary, or independent verification has clear value.

**Architectural implication today:** Separate conceptual theme variables from global/base styles in source; do not create a package boundary yet.

## 10. Legacy-style `tailwind-config` package

**Status:** Deferred; not selected by the Phase 2 proposal

**Why it matters:** Older monorepo patterns often centralize JavaScript Tailwind configuration, but Tailwind v4's current model is CSS-first and can share theme variables through CSS.

**Current-phase impact:** Do not add a `tailwind-config` package during Phase 2 without a requirement current CSS-first mechanisms cannot satisfy.

**What is not decided:** Whether a future tool/version or multi-surface requirement could justify a shared Tailwind-related package.

**Revisit trigger:** A demonstrated configuration need cannot be expressed coherently through the selected Tailwind version's supported CSS-first model.

**Architectural implication today:** Treat shared CSS as source, verify current upstream guidance at implementation time, and avoid importing a superseded configuration assumption.

## 11. Generic runtime integration category or folder

**Status:** Candidate

**Why it matters:** Future capabilities may need an explicit boundary between portable logic and application/runtime-specific integration.

**Current-phase impact:** No generic runtime folder/package is created. `apps/web` and `apps/storybook` own runtime integration around shared UI.

**What is not decided:** Whether this becomes a category, capability-specific adapter packages, subpath exports, colocated bindings, or no new boundary at all.

**Revisit trigger:** Integration code duplicates across real runtime consumers, a shared capability needs multiple runtime implementations, or runtime dependencies contaminate portable packages.

**Architectural implication today:** Maintain dependency direction from application/runtime-specific integration toward portable capability, never the reverse.

## 12. Widgets subsystem

**Status:** Deferred

**Why it matters:** Widgets could become a coherent, demonstrable UI/product subsystem with their own rendering, states, data/source contracts, layout participation, tests, and stories.

**Current-phase impact:** None. Phase 2 must not create widgets or a widgets package.

**What is not decided:** Widget definition, lifecycle, identity, source/input model, relationship to Dashboards, persistence, package ownership, public API, or terminology. The ADR candidate list remains authoritative.

**Revisit trigger:** An accepted product slice requires a widget, or Dashboard planning resolves enough lifecycle/source requirements for formal design.

**Architectural implication today:** Do not let a portfolio showcase invent the product's widget model. Future widget stories remain owned with the eventual widget capability.

## 13. Shared TypeScript configuration package

**Status:** Candidate

**Why it matters:** Web, Storybook, and a React/web library may require distinct TypeScript environment profiles built on a shared baseline.

**Current-phase impact:** Phase 2 should first use the minimum root/profile inheritance needed by real workspaces.

**What is not decided:** Whether profiles remain root files or become a `dev` package (renamed from `foundation` during the Phase 2 architecture reconciliation; no such package is currently justified merely by inheritance or convenience); profile names; bundler/module options; declaration/output strategy; or publication.

**Revisit trigger:** Two or more workspaces need a coherent reusable profile that root files cannot express cleanly, or isolation enforces an accepted boundary.

**Architectural implication today:** Share compiler policy without assuming shared configuration must be a package.

## 14. Shared Vitest configuration

**Status:** Candidate

**Why it matters:** UI component tests, web application tests, and future Node-only packages may need different environments under coherent repository-wide reporting/coverage policy.

**Current-phase impact:** Use Vitest 5 test projects and workspace-local differences only where required. No config package is pre-created.

**What is not decided:** Project list, environment packages, browser mode, coverage thresholds, config package, setup-file ownership, or Storybook/Vitest integration.

**Revisit trigger:** Nontrivial configuration repeats across at least two real workspaces or independent ownership becomes valuable.

**Architectural implication today:** Keep global orchestration at root and local semantics with their workspace.

## 15. Testing utilities and mocks package

**Status:** Deferred

**Why it matters:** Multiple workspaces may eventually need a coherent render helper, browser fixtures, accessibility harness, or reusable test data.

**Current-phase impact:** None. Phase 2 writes local helpers where the first consumer owns them.

**What is not decided:** Whether shared utilities exist, whether mocks are desirable, package boundaries, public API, or which environments they support.

**Revisit trigger:** At least two real workspaces repeat substantial testing behavior, or an accepted invariant needs one shared independent oracle.

**Architectural implication today:** Do not extract three-line setup or generic mocks; prefer tests that call real public behavior.

## 16. Storybook configuration or utilities package

**Status:** Deferred

**Why it matters:** Multiple story-owning packages may later need shared decorators, documentation blocks, fixtures, or story utilities.

**Current-phase impact:** `apps/storybook` owns the first runtime configuration; component packages own stories.

**What is not decided:** Whether a separate config/utility package exists, its consumers, API, builder coupling, or publishing model.

**Revisit trigger:** A second real story-owning package needs the same nontrivial capability and keeping it app-owned would invert dependency direction or create duplication.

**Architectural implication today:** Keep stories portable and avoid imports from application internals.

## 17. Layered UI packages (`ui-core`, `ui-shadcn`, component tiers)

**Status:** Deferred; not selected by the Phase 2 proposal

**Why it matters:** Layered packages can sometimes isolate stable primitives, acquisition sources, or higher-level compositions, but they also encode taxonomy before consumers exist.

**Current-phase impact:** Create only one shared UI ownership boundary. shadcn ancestry does not create a package layer.

**Current disposition (Phase 2 architecture reconciliation):** `@synapcity/ui-core` is now the selected name for the single consolidated initial UI package (see the Phase 2 design proposal §4.1 and §6.3). Selecting that name does **not** mean the layered UI package architecture explored below has been accepted. This entry's historical exploration of `ui-core` → `ui-shadcn` → higher-level component tiers is preserved as evidence, not adopted as a plan: broader UI package layering remains deferred until demonstrated ownership and consumer pressure justify extraction, exactly as it did before this name was settled.

**What is not decided:** Whether future scale, publication, dependency constraints, or teams justify multiple UI packages.

**Revisit trigger:** Independent consumers, release lifecycles, dependency directions, or ownership responsibilities demonstrably diverge.

**Architectural implication today:** Consumers import the Synapcity-owned public UI API and remain unaware of source ancestry.

## 18. Broader foundational/config package family

**Status:** Deferred

**Why it matters:** Names such as `prettier-config`, `storybook-utils`, `vitest-utils`, and `test-mocks` can appear tidy, but foundational concerns do not automatically require packages.

**Current-phase impact:** Repository-global policy stays at root. Workspace-local capability stays local. Extraction requires consumers or enforcement value.

**What is not decided:** Any package names, contents, category placement, or publication strategy.

**Revisit trigger:** At least two concrete consumers need a coherent capability, or a package boundary is needed to enforce an accepted architecture rule.

**Architectural implication today:** Apply “foundational does not imply package” during planning and review.

## 19. Cross-platform portability

**Status:** Candidate principle for future architecture review; not an implementation target

**Why it matters:** Future web, docs, desktop, and mobile surfaces could benefit from portable schemas, contracts, domain rules, or theme computation.

**Current-phase impact:** Influence coupling choices only where avoiding runtime coupling is cheap and natural.

**What is not decided:** Supported platforms, portability guarantees, shared APIs, adapter strategy, build targets, or UI reuse.

**Revisit trigger:** A second platform becomes an approved real consumer.

**Architectural implication today:** Design for portability without implementing speculative portability.

## 20. Visual regression and richer Storybook verification

**Status:** Exploration

**Why it matters:** As the UI system grows, visual regression could protect themes, component states, responsive variants, and portfolio polish that semantic tests do not capture.

**Current-phase impact:** Not required for Phase 2 exit unless the implementation design finds a minimal current-tool path essential to deployment evidence.

**What is not decided:** Provider, hosted service, snapshot policy, baselines, cost, CI gating, tolerances, or ownership.

**Revisit trigger:** The UI surface has enough stable visual states that manual review becomes unreliable or repeated visual regressions occur.

**Architectural implication today:** Keep stories deterministic and representative without building a visual-regression platform.

## 21. Turborepo remote caching

**Status:** Deferred

**Why it matters:** Remote caching could reduce CI and multi-machine build time once task outputs and environment inputs are trustworthy.

**Current-phase impact:** Phase 2 requires correct local graph/caching semantics, not remote-cache rollout.

**What is not decided:** Provider, credentials, trust boundary, cache scope, secrets/environment policy, CI integration, retention, or cost.

**Revisit trigger:** Local and CI timings show material value after cache correctness is demonstrated, or collaboration across machines creates repeated work.

**Architectural implication today:** Declare accurate inputs/outputs and keep secrets out of cacheable outputs so future remote caching remains possible.

## 22. Affected-task and selective-deployment optimization

**Status:** Deferred

**Why it matters:** A growing monorepo may save time by running/deploying only affected surfaces.

**Current-phase impact:** Use supported Turbo/Vercel dependency behavior, but prioritize correctness and explicit edges over custom optimization.

**What is not decided:** Custom filters, CI matrices, ignore scripts, changed-since base, deployment-skip overrides, or performance targets.

**Revisit trigger:** Measured CI/deployment cost is material, or default affected behavior proves wrong or insufficient.

**Architectural implication today:** Declare internal dependencies accurately so platform-supported affected analysis has trustworthy inputs.

## 23. Additional reusable UI primitives

**Status:** Deferred

**Why it matters:** Phase 3 will need more than one primitive, but predicting the set now risks building a library without consumers.

**Current-phase impact:** Phase 2 uses one representative primitive as a pipeline probe.

**What is not decided:** Which primitive beyond the proof, component APIs, variants, composition patterns, or taxonomy.

**Revisit trigger:** A Phase 3 shell or later product feature requires the component.

**Architectural implication today:** Make the first primitive's ownership, public API, tests, story, accessibility, and consumption path exemplary rather than broad.

## 24. Public package publication/versioning

**Status:** Exploration

**Why it matters:** A mature UI system might eventually benefit from public packages or independent releases as part of a professional portfolio.

**Current-phase impact:** None. Phase 2 workspaces remain private and repository-internal unless separately approved.

**What is not decided:** Whether anything is published, registry, package names, semantic versioning, changesets/release automation, compatibility contract, or support policy.

**Revisit trigger:** A real external consumer or explicit portfolio distribution goal is approved.

**Architectural implication today:** Keep public exports intentional, but do not incur external API compatibility promises.

## 25. Ledger review rule

**Status:** Candidate process

**Why it matters:** A ledger that is never revisited becomes a graveyard; one reviewed too often turns speculation into roadmap pressure.

**Current-phase impact:** Review relevant entries only when a stated trigger occurs or at a phase-design boundary.

**What is not decided:** Review cadence, automation, or ownership beyond the repository owner.

**Revisit trigger:** Completion of Phase 2 design review, start of Phase 3 design, or occurrence of any entry's explicit trigger.

**Architectural implication today:** Agents should search this ledger for context but must not implement from it.

## 26. Dedicated design-system package

**Status:** Deferred

**Why it matters:** A mature UI platform may eventually need ownership for design foundations beyond components, especially if tokens, guidance, assets, or release policy gain independent consumers.

**Current-phase impact:** None. Phase 2's shared UI boundary owns the minimum styling contract needed by its two application consumers.

**What is not decided:** Whether a design-system package exists, whether it owns components, tokens, styles, documentation, assets, governance, or publication, and what it would be called.

**Revisit trigger:** The design foundation gains responsibilities or consumers that are coherent and independent from reusable component ownership.

**Architectural implication today:** Do not use a broad `design-system` label to collapse unresolved token, theme, component, and documentation ownership into one package.

## 27. Generic hooks or utilities packages

**Status:** Deferred

**Why it matters:** Reusable hooks or utilities may eventually cross capability boundaries, but generic collection packages often become ownerless dependency magnets.

**Current-phase impact:** None. A helper remains with the component, app, or capability that owns the behavior.

**What is not decided:** Whether any shared hook/utility boundary exists, package names, eligibility rules, public API, runtime assumptions, or dependency direction.

**Revisit trigger:** The same coherent behavior has multiple real consumers and no existing owner can hold it without creating the wrong dependency direction.

**Architectural implication today:** Do not create `hooks`, `utils`, or similar catch-all packages; extract by responsibility, not by code shape.

## 28. Shared contracts capability

**Status:** Exploration

**Why it matters:** Multiple future surfaces may eventually need stable, portable contracts that are independent of UI and application runtimes.

**Current-phase impact:** None. Phase 2 has no product API, persisted schema, or cross-platform contract to share.

**What is not decided:** What qualifies as a contract, package ownership, schema technology, versioning, compatibility, generation, or relationship to domain packages.

**Revisit trigger:** Two approved consumers need the same stable boundary and an authorized product/architecture decision defines its semantics.

**Architectural implication today:** Do not invent contract types to prepare for hypothetical consumers, and do not move unresolved product terminology into durable identifiers.
