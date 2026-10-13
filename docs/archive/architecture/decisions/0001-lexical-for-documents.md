# ADR-0001: Lexical for Documents

**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Founder (technical direction)

## Context

Lexical is the founder-confirmed editor direction for Synapcity's general-purpose textual composition capability, provisionally called **Documents**. No prior implementation of this capability exists to inherit from — any editor-governance rules describing Lexical usage elsewhere describe an unbuilt architecture, not validated practice, and are not adopted by reference.

This ADR records what is actually decided (the editor library) and nothing else.

## Decision

Lexical is the accepted editor for Synapcity's Document capability.

## Scope

This decision governs **only** the choice of rich-text editor library for the Document capability. It does not extend to:

- the Document persisted schema or serialized envelope format;
- the registered Lexical node set;
- the extension/plugin boundary;
- the internal addressability/anchor mechanism for Document regions;
- import/export or interoperability formats;
- the collaboration model;
- the relationship between Documents and any future canonical-identity or relationship system;
- package topology, routes, or storage technology for Documents.

## What this does NOT decide

- That any previously explored Lexical-adjacent governance (versioned-envelope rules, a `synapcity://` entity-reference scheme, an `EntityRef` type) is adopted. Those remain independently unresolved and must not be treated as pre-decided merely because they exist in prior documentation.
- That a "Document" is one entity, or that Document and any prior "Note" concept unify. That naming/identity question is explicitly unresolved (see `docs/glossary.md`).
- Any node registration decisions, since no node set has been designed or agreed.

## Unresolved

- Persisted envelope format and versioning strategy.
- Node-set discipline and extension policy.
- Internal addressability/anchor algorithm and its survival across edits.
- Import/export and interoperability formats.
- Collaboration model (single-user editing only is the current scope; see `PRODUCT.md`'s "Initial user" section).
- Whether and how a Document can hold a live representation of other canonical information without becoming a second owner of it (architecture principle §2).

## Governance boundary

Changes to the editor-library choice itself require founder/human product-owner approval, since it is a technical direction with real switching cost. Changes to the unresolved items above are separate decisions, each requiring its own ADR as the relevant work is scoped.

## Integration expectations

- Lexical integration must respect the responsibility boundaries in `docs/architecture/principles.md` §6: pure Document domain logic (parsing, validation, migration) must not depend on Lexical's React bindings; Lexical's own React/DOM concerns belong in a runtime/UI layer, not a domain layer.
- Whatever persisted envelope is eventually designed must satisfy `docs/architecture/principles.md` §5 — initial-load authority, hydration precedence, write authority, durability destination, migration, validation, and failure-recovery must each be stated separately, not collapsed into one flag or one function.
- No integration work may assume any previously described Lexical governance is already-decided architecture; each rule must be independently evaluated against real requirements when Document persistence work actually begins.

## Verification expectations

Per `docs/engineering/definition-of-done.md`: any Lexical integration work must state explicitly which of "implemented," "tested," "wired into the application," "user-reachable," and "exercised" it has achieved, and must not claim more. A Lexical editor that compiles and renders but has no persisted, validated round-trip is not "Document persistence" — it is an editor UI prototype, and must be labeled as such.

## Reconsideration conditions

This direction should be revisited if:

- Lexical proves structurally unable to support the required node/extension model once real Document requirements are scoped;
- a licensing, maintenance, or security concern makes Lexical unsuitable;
- the founder explicitly changes the technical direction.

Any reconsideration must be a new ADR explaining the evidence, migration consequences for any Document content that already exists, and the new reconsideration criteria — not a silent substitution.
