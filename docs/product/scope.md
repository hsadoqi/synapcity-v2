# Product scope

**Status:** Canonical scope boundary
**Scope type:** Conceptual foundation, not an implementation roadmap

## Purpose

This document states what Synapcity must be able to reason about coherently during its foundational phase. It does not assert that every included concept belongs in the first implementation slice.

## Foundational product scope

The foundation includes:

### Operating model

- Synapcity-wide operation as a first-class context.
- User-defined contextual working environments.
- A semantic distinction between operating context and working surface.
- Optional, potentially many-to-many contextual participation.
- Creation context as a source of defaults rather than permanent ownership.
- Global findability independent of remembering a particular context.

### Information identity and reuse

- Canonical identity that survives contextual presentation.
- Specialized capability behavior with shared interoperability where useful.
- An explicit distinction among the same canonical thing, a semantic reference, an independent copy, and a detach/fork outcome.
- Meaningful addressability, including supported internal targets where justified.
- Semantic connections, external references, comments, and annotations as distinct areas requiring later design.
- Provenance and meaningful history sufficient to let information outlive its originating context.

### Working capabilities

- General-purpose textual composition, provisionally called Documents.
- Spatial composition, provisionally called Dashboards, using product-defined Widgets.
- A persistent application shell with global orientation and navigation.
- A product-defined global orientation surface whose exact relationship to Dashboards remains open.
- An application-level non-modal utility surface.
- A distinct Document-specific contextual surface.
- Interruption-safe capture.
- Search, discovery, contextual resurfacing, and meaningful resumption at the requirement level.
- Bounded global and contextual customization.

### Product behavior principles

- Useful before configurable.
- Progressive disclosure.
- Context without mandatory containment.
- One authoritative owner for canonical information.
- Representations may own presentation configuration but not silent divergent copies.
- Working context should not be destroyed unnecessarily.
- User-visible history should describe meaningful changes.
- User-visible claims must correspond to real behavior.

## Initial delivery boundary

Synapcity is single-user first.

The first product slice has not yet been selected. Phase 0 must not smuggle a sequence into architecture by creating packages, schemas, routes, or storage structures for every foundational concept at once.

The MVP process must select a bounded proof, identify what it intentionally excludes, and state what evidence would justify expansion.

## In scope as accepted technical directions

Two technologies enter Phase 0 as founder-confirmed directions:

- Lexical for the Document editor.
- React Grid Layout for Dashboard spatial composition.

Their inclusion does not adopt the previous implementation's integrations or select persistence, serialization, package, state, route, or extension architecture.

## In scope as decision work, not implementation commitments

The following are legitimate Phase 0 decision areas but are not yet selected designs:

- product positioning and initial-user framing;
- controlled vocabulary;
- first vertical slice and success evidence;
- canonical identity and contextual participation mechanics;
- capture lifecycle;
- relationship and addressability semantics;
- history, deletion, archival, restoration, and recovery semantics;
- search and resumption semantics;
- state and persistence scopes;
- official implementation architecture;
- documentation, AI, security, and acceptance governance.

## Outside the initial committed slice

Unless an accepted decision explicitly changes their status:

- real-time collaboration and concurrency;
- multi-user permissions, sharing, or tenancy;
- AI product capabilities;
- broad external integrations and synchronization;
- comprehensive Tasks, Goals, and Habits;
- plugin or extension ecosystems;
- comprehensive automation and background workflows;
- mobile/native/PWA product surfaces;
- a universal relationship framework or graph database;
- unrestricted user-defined schemas or arbitrary application building.

These are not all permanent non-goals. See [non-goals and deferrals](non-goals.md).

## Scope change rule

A scope change requires:

1. a product reason grounded in an accepted need;
2. an explicit status change from deferred or unresolved;
3. impact on current milestone and acceptance criteria;
4. architecture and compatibility consequences where applicable;
5. human product-owner approval.

Repository presence, prototype polish, test coverage, or implementation investment is not sufficient evidence for a scope change.

