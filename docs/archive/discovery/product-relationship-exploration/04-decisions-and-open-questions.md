# Decision record and follow-up agenda

**Status:** Exploratory record, not an ADR  
**Recorded:** 2026-10-25

## Expressed product preferences

| Topic | Direction expressed | Confidence |
| --- | --- | --- |
| Space hierarchy | Home is sole global parent; every other Space directly beneath it | Explicit |
| Dashboard relationship | A Space may own multiple dashboards shown as tabs, with Overview the default | Explicit |
| Dashboard show page | Retain dedicated dashboard detail/show presentation | Explicit |
| Space Library | One first-class Library per Space | Explicit |
| UI vocabulary | Prefer Library to Documents as collection destination | Explicit |
| Document sharing | Same canonical document can appear in multiple Libraries; edits reflect everywhere | Explicit |
| Content transfer | Support reorganizing/transferring content when deleting/replacing Spaces | Explicit intention; exact mechanics open |
| Home behavior | Preserve pinned documents/Spaces/dashboards and recents | Explicit |
| Global views | Task board, schedule, agenda across Spaces; may be placed on any dashboard | Explicit |
| Library resources | Native documents, links, uploaded files, potentially downloaded files | Explicit |
| Shared view reuse | User can choose linked versus independent copy | Explicit |
| `Entity` | Strong user interest in a shared base model | Explicit interest; exact representation undecided |

## Recommendations, not decisions

- Separate identity, content ownership, organizational membership, and dashboard presentation.
- Model Library membership as a join table to canonical resource identities.
- Consider a thin `Entity` table with typed detail tables, while comparing against independent typed-table alternatives.
- Distinguish reusable view definition from dashboard-specific placement.
- Keep Library UI terminology decoupled from `Document` domain terminology.
- Keep pinned/recent associations independent of Library membership.
- Treat Home global aggregation and Home Library membership as different features.
- Manage Space deletion via explicit operations; do not cascade shared resources accidentally.

## Open product questions (priority order)

1. **Authoritative ownership:** Is an Entity owned by an account/workspace, by one Space, or another authority? How does this interact with membership and future multi-user permissions?
2. **Last Library association:** Does removing the final membership automatically add membership to Home Library, transfer ownership to Home, or both? What happens when the user explicitly deletes rather than removes?
3. **Home Library semantics:** Explicitly assigned resources only, aggregate all resources, or a combined/filtered experience?
4. **Library eligibility:** Are tasks/events Library resources or only domain data displayed through dashboards? What kinds are valid Library members?
5. **Reusable view ownership:** Does a linked view belong to a specific Space, the creator/account, or another container? What happens when its creating Space is deleted?
6. **Linked settings:** Which fields synchronize (filter/scope/sort/title) and which remain per-placement (size/layout/renderer mode)? What happens on "make independent"?
7. **Scope resolution:** Does `current-space` mean view owner's Space or dashboard placement Space? Can a shared view change its results depending on placement?
8. **Space deletion and trash:** Transfer prompt, soft deletion, undo/restore, orphan prevention, hard-delete and blob retention rules.
9. **File import boundaries:** Upload vs URL bookmark vs downloaded snapshot; duplicate detection, provenance, lifecycle, previews, security and quota policy.
10. **Entity admission policy:** Which types merit global IDs and relationships? Are Dashboards, Spaces, Views, Libraries themselves Entities, or only certain resource types?

## Suggested next validation sequence

1. Write two contrasting examples: shared document across two Libraries, and shared view across two dashboards with "linked" then "independent" behavior.
2. Decide authoritative owner and last-membership fallback before choosing delete FKs.
3. Compare two minimal PostgreSQL schema sketches: thin `Entity`/typed details and independent typed tables.
4. Prove integrity and transactions for create, share, unlink, transfer, delete, restore, and linked-view clone, including failure paths.
5. Design an interaction prototype for Space tabs, Library browser, and widget reuse; validate discoverability before committing routes.
6. Reconcile against existing Synapcity glossary, ADRs, phase scopes, and route conventions. Introduce scope changes explicitly instead of silently treating the exploratory packet as canonical.

## Out of scope for this packet

No committed migration, route change, schema, API contract, editor, file storage backend, authorization system, or task/calendar implementation. Future features are examples used to stress-test the model.
