# Definition of Done

**Status:** Canonical engineering verification standard

Passing tests, a working demo, or a confident report do not by themselves establish that something is done. This document states what "done" requires and, just as importantly, requires that a verification report be able to say **NOT VERIFIED** rather than manufacture certainty.

## The governing distinction

> ```
> tested ≠ consumed ≠ exercised ≠ product-required ≠ product-validated ≠ canonical
> implemented ≠ validated
> ```

These are six (and two) different claims. A change may satisfy some without satisfying others. Every completion report must state which of these it can actually claim — not the strongest-sounding one.

- **Implemented** — the code exists and runs.
- **Tested** — a test exercises it.
- **Consumed** — something else in the codebase imports or calls it.
- **Exercised** — a real, reachable user or system path actually triggers it during real use, not only in a test harness.
- **Product-required** — a founder or product-owner decision says this behavior is actually needed.
- **Product-validated** — real usage evidence (not a test, not a demo) supports that it works for its intended purpose.
- **Canonical** — accepted as the current, governing implementation of a concern.
- **Validated** — independently checked against the requirement it claims to satisfy, not merely checked against its own interpretation of that requirement.

Treat every future claim of "done" with this same scrutiny — it is entirely possible for something to be fully implemented and fully tested while having zero consumers anywhere in the application, which satisfies none of "consumed," "exercised," or "product-required."

## What "done" requires, in proportion to risk

For any change, before claiming completion, check the applicable items:

1. **Observable behavior matches the claim.** If a UI shows a count, a save-state indicator, a badge, or an interactive control, it must correspond to real, working behavior. A prototype or fixture must be visibly identifiable as such — never presented as if it were real, persisted, or computed. This is a repeatedly-observed failure pattern; do not repeat it.
2. **Prototypes and fixtures are identifiable.** Static/fixture-backed data must be labeled or otherwise distinguishable from persisted, computed data — in code comments at minimum, in the UI where the claim is user-facing.
3. **Tests protect the intended invariant category**, and the report names which category: domain truth, observable behavior, architecture/boundary enforcement, a specific regression, framework mechanics, fixture/prototype behavior, an anticipated future capability, or an orphaned mechanism with no current consumer. A test with a self-consistent oracle (i.e., checking a function's output only against another output of the same code, not against an independent standard) should be labeled as such — it can catch a regression but cannot establish correctness against an external requirement.
4. **Accessibility** is checked in proportion to what the change touches: semantic HTML, keyboard operability, focus visibility, `prefers-reduced-motion`, and screen-reader-relevant labeling for anything interactive or newly rendered.
5. **Failure and recovery behavior is defined**, not merely "the happy path works." State what happens on validation failure, network failure, or a malformed persisted value, and whether that failure is visible to the user or only logged.
6. **Migrations** are considered for any change to a persisted shape: what happens to already-persisted data, and is that migration itself tested.
7. **Destructive operations** state their exact scope and recovery path before being implemented — hard delete vs. archive vs. trash, confirmation requirements, and whether the operation is reversible. Do not assume any single pattern is "the" convention without deciding it deliberately.
8. **Documentation** is updated to match — a status label change, an updated open-decision entry, or an ADR, as appropriate. See `docs/engineering/documentation.md`.
9. **Architecture constraints are respected** — no new silent second owner (principles §2), no ownership inferred from route/UI hierarchy alone (§3), initial-load vs. durability authority stated separately if persistence is involved (§5).
10. **Evidence is honestly labeled.** State plainly what is directly verified in this pass versus what is carried forward from a prior report, a comment, or an assumption, and mark genuinely unverified claims as such rather than implying confidence the evidence doesn't support.
11. **Verification is run and reported exactly**, per the repository-wide check list in `AGENTS.md` where the change's blast radius requires it (format, lint, typecheck, tests, boundary checks, build) — report exactly what ran, what passed, what failed, and what was **not** run.
12. **Human acceptance** occurs for anything reserved to human authority: product purpose, terminology, architecture, dependencies, schemas, public APIs, security/trust decisions, and destructive changes (see `docs/engineering/ai-development.md`).

## Verification reports must be able to say NOT VERIFIED

A verification report is not required to prove everything works. It is required to be honest about what it did and did not check. "Not verified in this pass" is an acceptable, expected, and often correct conclusion — it is not a failure of the report. Do not:

- upgrade "I read the code and it looks consistent" to "verified";
- upgrade "a test with the same author/session wrote and passed" to "independently confirmed";
- upgrade "this matches what a prior report said" to a second, independent confirmation, when no new evidence was actually gathered;
- claim "PASS" for a check that was not actually run.

## Ownership of this standard

This Definition of Done applies to Synapcity engineering work generally. Individual ADRs may add stricter verification expectations for their own scope (see the "Verification expectations" section of the ADR template in `docs/architecture/decisions/README.md`); they may not weaken this baseline.
