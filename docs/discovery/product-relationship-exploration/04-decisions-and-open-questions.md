# Decision record and follow-up agenda

**Status:** Exploratory record, not an ADR  
**Recorded:** 2026-10-25

## Expressed product preferences

| Topic                  | Direction expressed                                                                                                                                                                                                                                       | Confidence                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Space hierarchy        | Home is sole global parent; every other Space directly beneath it                                                                                                                                                                                         | Explicit                                                               |
| Dashboard relationship | A Space may own multiple dashboards shown as tabs, with Overview the default                                                                                                                                                                              | Explicit                                                               |
| Dashboard show page    | Retain dedicated dashboard detail/show presentation                                                                                                                                                                                                       | Explicit                                                               |
| Space Library          | One first-class Library per Space                                                                                                                                                                                                                         | Explicit                                                               |
| UI vocabulary          | Prefer Library to Documents as collection destination                                                                                                                                                                                                     | Explicit                                                               |
| Document sharing       | Same canonical document can appear in multiple Libraries; edits reflect everywhere                                                                                                                                                                        | Explicit                                                               |
| Content transfer       | Support reorganizing/transferring content when deleting/replacing Spaces                                                                                                                                                                                  | Explicit intention; exact mechanics open                               |
| Home behavior          | Preserve pinned documents/Spaces/dashboards and recents                                                                                                                                                                                                   | Explicit                                                               |
| Global views           | Task board, schedule, agenda across Spaces; may be placed on any dashboard                                                                                                                                                                                | Explicit                                                               |
| Library resources      | Native documents, links, uploaded files, potentially downloaded files                                                                                                                                                                                     | Explicit                                                               |
| Shared view reuse      | User can choose linked versus independent copy                                                                                                                                                                                                            | Explicit                                                               |
| `Entity`               | Reusable TypeScript contracts, operations and UI abstractions so different domain objects can take part in shared components without coupling their underlying models; not a shared database table (see [05](05-shared-ui-contracts-and-capabilities.md)) | Explicit (clarified 2026-10-25); name provisional, contracts undefined |

## Recommendations, not decisions

- Separate identity, content ownership, organizational membership, and dashboard presentation.
- Model Library membership as an explicit relationship to canonical resources, not as copies. The table shape is open (see [02](02-entity-relationship-model.md), section 3).
- Keep UI and application contracts (05) separate from persistence design (02). A shared TypeScript contract does not create a database relationship, and no persistence strategy is recommended yet.
- Distinguish reusable view definition from dashboard-specific placement.
- Keep Library UI terminology decoupled from `Document` domain terminology.
- Keep pinned/recent associations independent of Library membership.
- Treat Home global aggregation and Home Library membership as different features.
- Manage Space deletion via explicit operations; do not cascade shared resources accidentally.

## Decisions recorded after discussion (2026-10-25)

Owner decisions made in conversation. They are not ADRs; the persistence items bind only until the owner changes them.

- **Terminology.** "Library" is the user-facing term and `Document` stays internal. The glossary has the entry.
- **Tables for now.** Keep `spaces`, `documents` and `dashboards` as they are. Do not add a `libraries` table: a Library is the Space's participation list until it has data of its own. Do not add dashboard layout or placement tables yet.
- **Labels, routes and page layouts** are unchanged for now. Renaming them is cheap and can wait. The owner chose not to spend time on page layouts until it is clearer which pages will exist and what needs presenting.

Discussed but **not decided**:

- **Dashboard layout storage.** One versioned JSON column on `dashboards` was offered as a later option; ADR-0013 still leaves widget and layout storage open, and the dashboards canvas spec currently keeps layouts in the browser.
- **Tabs for opened items.** An idea that opened documents and dashboards appear as tabs inside a Space, with nothing shown by default and the sidebar keeping global navigation. Whether it uses intercepting routes or nested routes, and what a refresh does, are parked.
- **Home and the Spaces index.** An idea to combine them. Not decided or scheduled.

## Open product questions (priority order)

1. **Authoritative ownership:** Is a resource (document, file, link) owned by an account/workspace, by one Space, or another authority? How does this interact with membership and future multi-user permissions?
2. **Last Library association:** Does removing the final membership automatically add membership to Home Library, transfer ownership to Home, or both? What happens when the user explicitly deletes rather than removes?
3. **Home Library semantics:** Explicitly assigned resources only, aggregate all resources, or a combined/filtered experience?
4. **Library eligibility:** Are tasks/events Library resources or only domain data displayed through dashboards? What kinds are valid Library members?
5. **Reusable view ownership:** Does a linked view belong to a specific Space, the creator/account, or another container? What happens when its creating Space is deleted?
6. **Linked settings:** Which fields synchronize (filter/scope/sort/title) and which remain per-placement (size/layout/renderer mode)? What happens on "make independent"?
7. **Scope resolution:** Does `current-space` mean view owner's Space or dashboard placement Space? Can a shared view change its results depending on placement?
8. **Space deletion and trash:** Transfer prompt, soft deletion, undo/restore, orphan prevention, hard-delete and blob retention rules.
9. **File import boundaries:** Upload vs URL bookmark vs downloaded snapshot; duplicate detection, provenance, lifecycle, previews, security and quota policy.
10. **Two separate questions that the word `Entity` can blur.** Answer them independently.
    - **10a. UI and application contract admission.** Which object kinds should adapt to shared UI contracts and capabilities (display metadata, available actions, pin/archive/duplicate operations)? Use the criteria in [05](05-shared-ui-contracts-and-capabilities.md), section 6: at least two concrete consumers, the narrowest contract each needs, and adapters at the boundary. Dashboards, Spaces, views and Libraries may or may not need to be displayed or acted on alongside documents; that is a consumer question, not an identity question.
    - **10b. Persistence identity and relationships.** Do any cross-type relationships need relational integrity, and if so which strategy in [02](02-entity-relationship-model.md), section 3 fits? Whether a shared identity registry (the alternative in 02, section 4) would ever be justified, and for which kinds, is decided here and not by 10a.

## Suggested next validation sequence

1. Write two contrasting examples: shared document across two Libraries, and shared view across two dashboards with "linked" then "independent" behavior.
2. Decide authoritative owner and last-membership fallback before choosing delete FKs.
3. For persistence (10b), once the cross-type relationships that need integrity are named: compare minimal sketches of the strategies in 02, section 3. A registry table is one of them, not the default.
   3a. For UI contracts (10a), independently of step 3: list the existing components that would consume a shared contract today, define the narrowest contract each needs, and prototype one adapter (05, sections 4 and 6).
4. Prove integrity and transactions for create, share, unlink, transfer, delete, restore, and linked-view clone, including failure paths.
5. Design an interaction prototype for Space tabs, Library browser, and widget reuse; validate discoverability before committing routes.
6. Reconcile against existing Synapcity glossary, ADRs, phase scopes, and route conventions. Introduce scope changes explicitly instead of silently treating the exploratory packet as canonical.

## Terminology status (reconciled with `docs/glossary.md`, 2026-10-25)

This section records how the packet's words stand against the glossary. It does not resolve or override the glossary's naming-decision process.

- **`Entity`** is used in this packet as a **provisional name for a UI/application abstraction**: composable TypeScript contracts, reusable operations and presentation primitives (see 05). It is not a product term, domain noun, table, package or route name, and no schema, API, package or route name should be derived from it.
- **The glossary entry "Entity, resource, item, record"** is _Unresolved/implementation-sensitive_; none of the four words is accepted as the universal user-facing or domain-level noun. The glossary also lists normalized `entities`/`ids` collections and experimental identifiers such as `EntityRef` among implementation vocabulary with no automatic authority. Words used in 05's illustrative code (`ResourceRef`, `DisplayItem`, `UiResource`, `Identifiable`) are working labels in that same unresolved family and carry the same caveat.
- **Existing code** already uses entity-named UI pieces (for example `entity-content` and `entity-date` in `packages/frontend/collection/src/components`). Their status is governed by the glossary and ADR-0011, not by this packet.
- **Adopted terms the packet relies on:** Space, Dashboard and Widget (Adopted); Home ("Adopted need; detailed model unresolved"); Copy, and Fork / detach ("Adopted semantic outcome"). The packet's "independent copy" and "make independent" are the behaviors those two entries describe; the glossary terms can be used for them.
- **`View`:** the glossary says not to promote `View` into a domain type without an accepted decision. This packet uses "view" for the reusable configuration behind a widget (03) as a working label only.
- **`Library`** was added to the glossary on 2026-10-25 as an accepted user-facing label (owner decision). `Document` stays the internal name of the document type.
- **`Placement`** also does not appear in the glossary and is a working label.

## Unreconciled with accepted decisions (flagged, not resolved)

The packet states product directions that differ from decisions recorded elsewhere. Adopting them would amend those decisions; this packet makes no such change and settles none of them. Each item needs the owner's explicit choice.

- **Home.** The packet treats Home as a root Space with its own Library. [ADR-0013](../../architecture/decisions/0013-document-and-dashboard-persistence.md) records the global scope (Home) as not a Space record, with no row or participation table.
- **Dashboards and Spaces.** The packet says a Space owns dashboards shown as tabs. ADR-0013 records participation as zero, one or many Spaces per document or dashboard.
- **Items in no Space.** The packet suggests a fallback to Home when the last Library membership is removed. ADR-0013 treats an item in no Space as a normal state.
- **Ownership.** Open question 1 asks who owns a resource. ADR-0012 and ADR-0013 record account-level ownership with participation never transferring it.
- **Library membership.** The packet proposes a membership relationship; ADR-0013 persists participation in per-kind tables (`space_documents`, `space_dashboards`). Whether a Library is the same concept as participation is not stated in the packet.

## Out of scope for this packet

No committed migration, route change, schema, API contract, editor, file storage backend, authorization system, or task/calendar implementation. Future features are examples used to stress-test the model.
