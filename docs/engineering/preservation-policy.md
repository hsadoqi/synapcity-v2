# Preservation policy

**Status:** Canonical preservation and destructive-change policy
**Scope:** Governs the relationship between Synapcity and any previous/reference implementation that produced its evidence — an external, historical source, never the repository you are currently working in, regardless of name or apparent similarity — and governs destructive changes generally.

## The relationship, stated plainly

The previous implementation is **active experimental and reference evidence**. It is:

- not deprecated;
- not authoritative for Synapcity;
- not a conformance reference — passing its tests, matching its patterns, or reusing its code is never itself sufficient justification;
- not something that migrates to Synapcity wholesale, by default, or by inertia.

It is real, exercised evidence about what was tried, what worked, what broke, what was reasoned toward but never built, and what tensions surfaced along the way. Treat it the way you would treat a research prototype: valuable, worth mining deliberately, never assumed correct.

## Preserve unless explicitly authorized to clean up

Do not delete, overwrite, or destructively rewrite experimental or historical work merely because:

- Synapcity chooses a different direction;
- the work looks duplicated, stale, or superseded;
- an implementation has zero current consumers ("implemented does not mean canonical," and equally, "zero consumers does not mean safe to delete without asking");
- a naming convention or package boundary has since changed.

Prefer archiving to deleting when status is uncertain. An archive should record: original location, reason for archival, replacement (if any), the revision it was archived at, and restoration steps.

## Do not migrate directories wholesale

Adopting a concept from the previous implementation never means importing its package, its route, its schema, or its file tree unchanged. Evaluate independently:

- **concept** — is the underlying idea something Synapcity actually needs (check `PRODUCT.md`'s "Open product decisions" first);
- **terminology** — does the previous implementation's name for it match what Synapcity has decided to call it (often it hasn't decided yet — see the terminology/naming pass);
- **behavior** — does the exercised behavior actually match the requirement, or does it only look similar;
- **tests** — do the tests protect a real invariant, or an orphaned/fixture/anticipatory one (see `docs/engineering/definition-of-done.md`);
- **implementation** — is the actual code shape (package boundaries, dependencies, schemas) something Synapcity should adopt, adapt, or reject.

These five evaluations can land on different answers for the same artifact from the previous implementation. A concept can be ADOPTed while its terminology and implementation remain UNRESOLVED or are REJECTed outright — this is the same governing rule as `PRODUCT.md`'s "concept adoption does not imply terminology adoption, and neither implies implementation adoption."

## Consequential adoption needs a traceable rationale

Any adoption from the previous implementation that has real architectural consequences — a schema, a dependency, a persisted format, a package boundary — requires an ADR (see `docs/architecture/decisions/README.md`) that states:

- what specifically is being adopted;
- what evidence justifies it;
- what was deliberately left behind or changed;
- what risks or scars the previous version surfaced, and whether they were addressed.

Do not adopt something merely because it exists, works, is tested, or represents substantial engineering investment — engineering investment is not, on its own, evidence that a concept is product-required. Requirements need independent founder or product-owner confirmation; the _implementation_ still has to earn its own adoption decision separately.

## Preserve negative lessons

Where a failed or abandoned approach explains why a current invariant exists, preserve that lesson explicitly rather than only preserving the invariant. `docs/architecture/principles.md` records the _lessons_ on their own terms — a future reader should not need to know the specific historical episode that taught a lesson in order to follow the rule it produced.

## Destructive changes require exact scope and recovery strategy

Before any destructive change (deletion, irreversible migration, overwrite of untracked or concurrent work):

1. Identify exactly what is being destroyed — file/directory scope, not "roughly this area."
2. Identify current consumers, if any.
3. Identify a recovery path (git history, an archive, a backup) before acting, not after.
4. Get explicit approval scoped to that exact action — approval for one destructive change does not authorize adjacent cleanup.

Never overwrite cross-fork, untracked, or concurrent work without a recoverable snapshot and explicit approval — this is a real, previously-observed failure mode, not a risk unique to some other team.

## Deletion must not be inferred from contextual removal

Removing something from a context, an index, a route, or a visible surface is not the same as deleting it. Do not infer that an item's disappearance from one place means it should be deleted everywhere, and do not delete underlying data merely because a presentation layer stopped referencing it. This mirrors the product-level principle that contextual participation is not ownership (`docs/product/principles.md` #3-#4) — the same discipline applies to code and documentation, not only to product data.
