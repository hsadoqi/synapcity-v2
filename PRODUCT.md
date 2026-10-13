# Product foundation

<!-- impeccable:product-schema 1 -->

**Status:** Canonical product foundation  
**Decision scope:** Product concepts and principles only; terminology and implementation remain independently governed

## Platform

web

## Product thesis

Synapcity is a configurable personal working environment in which one person can create, organize, connect, present, discover, and revisit information globally and within user-defined contexts.

Synapcity supplies meaningful product-defined capabilities, coherent defaults, and interaction rules. The user composes and personalizes those capabilities for different parts of life and work without having to invent the product's domain model.

Information is not imprisoned by the context or surface in which it was created. The same canonical thing can participate in multiple contexts and representations while retaining its identity, relationships, provenance, and meaningful history.

This thesis is a product definition, not final market positioning or audience-facing copy.

## Problem

Personal work begins in motion: a thought is captured, information grows, relationships emerge, circumstances change, and the user must later find and resume what matters.

Existing organizational approaches often impose one or more avoidable costs:

- requiring classification or destination decisions at the moment of capture;
- trapping information inside the folder, project, workspace, view, or tool where it began;
- producing divergent copies when the same information is useful in several contexts;
- forcing navigation away from active work to inspect or capture related information;
- making users reconstruct their working context when they return;
- exposing configuration complexity before the product provides value.

Synapcity aims to reduce those costs while preserving clear ownership, specialized behavior, user control, and meaningful continuity.

The first product wedge within this broader problem remains an explicit open decision. Phase 0 does not pretend that every part of the problem must be solved in the first slice.

## Initial user

Synapcity is single-user first. Its initial product authority is grounded in the founder's real workflows and needs.

Whether the initial audience is framed as the founder specifically, a broader user profile modeled from those needs, or both remains open. Team and collaboration personas are not part of the initial committed scope.

## Adopted product model

### Synapcity-wide and contextual operation

Synapcity is the larger environment. Global operation is a legitimate working context, not merely the absence of a selected context.

Users may also enter user-defined contextual working environments. These environments can shape navigation, presentation, defaults, continuity, capability emphasis, and customization. The working label **Space** is used in this foundation only as a provisional handle; its final name is unresolved.

### Context and surface are different dimensions

An operating context identifies where the user is working: globally or within a user-defined context. A working surface identifies how the user is working, such as through a Document or Dashboard.

Changing surfaces does not necessarily change context. Opening the same canonical information from another context does not create a new canonical thing.

### Contextual participation is not ownership

Canonical information may participate in zero, one, or many user-defined contexts.

Creation within a context may supply useful defaults. It does not permanently bind the resulting information to that context.

Removing information from a context is therefore conceptually different from deleting the underlying canonical information. Exact lifecycle and deletion behavior remain unresolved.

### Product-defined capabilities

Synapcity defines capabilities with meaningful semantics. Users configure and compose them within supported boundaries; they are not required to build an arbitrary no-code database or application platform.

The adopted foundational capability directions are:

- general-purpose textual composition, provisionally called **Documents**;
- spatial composition, provisionally called **Dashboards**, using product-defined **Widgets**;
- user-defined contextual working environments;
- global navigation and orientation;
- an application-level, non-modal utility surface accessible from the persistent shell;
- a distinct Document-specific contextual surface;
- interruption-safe capture;
- addressability and semantic connection among meaningful supported targets;
- intentional reuse semantics;
- continuity, resumption, provenance, and meaningful history;
- bounded global and contextual customization.

These capability directions do not establish final names, schemas, routes, APIs, package boundaries, or persistence mechanisms.

### Canonical identity and specialized behavior

Supported capabilities may interoperate while retaining their own semantics. A Document does not need to behave like a Dashboard, and a future Task does not need to behave like either.

The shared requirement is narrower than a universal entity model: meaningful supported things need enough identity and addressability to participate in context, discovery, reuse, connection, and history where appropriate.

A representation must not silently become a second owner of information canonically owned elsewhere. This does not prevent a representation from owning legitimate presentation state such as layout, placement, filters, or local configuration.

### Intentional reuse

The product must preserve the user-significant distinction among:

1. showing the same canonical thing in another context or presentation;
2. creating a reference or semantic connection between distinct things;
3. making an independent copy;
4. detaching or forking something so it may evolve independently while retaining appropriate provenance.

This is a minimum semantic distinction, not a final command set or relationship taxonomy.

### Documents

Documents are the current working label for a general-purpose textual composition capability. Lexical is the founder-confirmed editor direction.

Documents may support whole-resource and meaningful internal addressability, connections, contextual inspection, history, and live representations of other supported information without taking ownership of that information.

The Document schema, persistence envelope, node set, extension policy, internal anchoring mechanism, import/export model, live-reference behavior, and collaboration model remain unresolved.

### Dashboards and Widgets

Dashboards are the current working label for spatial composition surfaces. React Grid Layout is the founder-confirmed layout direction.

A Dashboard may own layout, widget placement, presentation metadata, and widget-instance configuration. It must not silently own a divergent copy of information owned by another capability.

Widgets are product-defined interfaces that may use zero, one, or many inputs. A universal `Data Source` abstraction is not adopted; it remains an unresolved hypothesis.

### Application-level utility surface

Synapcity includes an application-level utility concept, provisionally called the **Global Panel**. It is triggered from the persistent shell, expands vertically, reflows the current work rather than replacing it modally, and is resizable, dismissible, and lockable.

It should be useful by default, user-configurable, and capable of contextual specialization. Example utilities do not establish a fixed module taxonomy.

This concept is distinct from the Document-specific contextual sidebar. The two may share lower-level implementation primitives only if a later architecture decision justifies that reuse.

### Capture and interruption safety

Users should be able to record something with low interruption cost without abandoning their current work.

The official product does not yet decide whether capture creates a durable object, an intake envelope, a draft, a direct instance of another capability, or a hybrid. The experimental `CaptureItem` schema and inbox lifecycle are not adopted automatically.

### Continuity, search, and resurfacing

Synapcity should help users intentionally retrieve information and return to meaningful work without reconstructing the entire context.

The need is adopted. The meaning of recency, relevance, current work, “Continue,” and resumption—as well as the search/index architecture—is unresolved.

### History and provenance

Information should be able to outlive its originating context without losing meaningful history.

Version history, provenance, user-visible activity or journey, restoration, synchronization history, audit evidence, analytics, and ephemeral logs are distinct concerns. Phase 0 adopts the concern, not one universal event log or event-sourced architecture.

### Customization

Customization is a real product concern that supports personal and contextual identity. Synapcity should maintain a coherent, accessible design system while permitting bounded global and contextual personalization.

Customization remains subordinate to the working product. It must not become a prerequisite for usefulness.

## Candidate jobs to validate

These jobs are evidence-supported Phase 0 inputs. Their exact wording, ordering, and first-slice priority remain subject to product approval:

- Capture something without abandoning current work or choosing a permanent destination immediately.
- Establish a working context without imprisoning information inside it.
- Work textually or spatially using capable product-defined surfaces.
- Connect and reuse information without creating accidental duplicates.
- Inspect related information while preserving the active working context.
- Return to meaningful work without reconstructing the context from scratch.
- Personalize the environment after it is already useful.

## Initial scope boundary

The foundational product scope includes the concepts and principles needed to reason coherently about global/contextual operation, canonical identity, Documents, Dashboards and Widgets, interruption-safe capture, connection and addressability, continuity, the application shell, the utility surface, and bounded customization.

That conceptual inclusion does not mean all capabilities belong in the first implementation slice. The first slice is intentionally unresolved and must be selected through the MVP decision process.

## Deferred direction

The following belong to the broader direction but are not part of the initial committed slice unless a later approved decision changes their status:

- specialized Tasks, Goals, and Habits;
- real-time collaboration;
- AI product capabilities;
- broad third-party integrations;
- advanced ingestion and synchronization;
- comprehensive automation;
- a plugin or extension ecosystem.

Deferred does not mean permanently rejected.

## Operating context

Synapcity is single-user first and grounded in the founder's real workflows (see Initial user). It is operated both globally and within user-defined contexts, through product-defined capabilities (see Adopted product model). The persistent shell carries global navigation, orientation and the application-level utility surface; this foundation does not decide the shell's final structure or naming.

## Positioning

Unresolved. Final product positioning and initial-user framing are on the Open product decisions list below. The product thesis above is a product definition, not market positioning, and nothing here should be read as a positioning claim.

## Brand commitments

The owner has confirmed two identity commitments, both held in `apps/web/public/brand-assets`:

- the wordmark is the lowercase word "synapcity";
- the mark is two overlapping rounded squares with a solid inner rectangle, with the `*-monochrome.svg` files (`logo-monochrome.svg`, `wordmark-monochrome.svg`) as the single-colour variants that do not depend on any accent.

No other brand fact is committed here. Type families, accent colour and any other palette decision are governed by their own documents and the open decisions below.

## Evidence on hand

- Brand assets: `apps/web/public/brand-assets` (mark, wordmark and logo, in colour-scheme-aware and monochrome variants). The favicon and app icons live in each app's `src/app` directory (`apps/web`, `apps/docs`), and the Open Graph card is the shared `OpenGraphCard` in `@synapcity/frontend-site`, drawn from an embedded copy of `logo-monochrome.svg`.
- No testimonials, customers, benchmarks, pricing or usage data are recorded in this repository. Future work must not fabricate them.

## Product principles

Product principles are owned by `docs/product/principles.md` and are not restated here, so that this file does not become a second authority for them.

## Open product decisions

This is the authoritative list of the highest-impact open product and terminology decisions. Terminology status for individual working labels is tracked in `docs/glossary.md`; architecture-dimension unresolved questions are tracked in `docs/architecture/decisions/README.md`'s candidate list and in each accepted ADR's own "Unresolved" section. A question's absence from this list is not authorization to decide it implicitly — see `docs/architecture/principles.md` §8.

Among the highest-impact open decisions are:

- the primary wedge and first vertical slice;
- final product positioning and initial-user framing;
- the name and internal organization of contextual working environments;
- Global Home and its relationship to Dashboards;
- Document/Note terminology and lifecycle boundaries;
- capture lifecycle and post-capture behavior;
- relationship taxonomy and addressability behavior;
- history, restoration, deletion, archival, and recovery semantics;
- search, relevance, and resumption semantics;
- widget lifecycle and source/input model.
