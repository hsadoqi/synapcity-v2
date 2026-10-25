# Product and information architecture

**Status:** Exploratory synthesis, 2026-10-25

## Problem and intent

The earlier separation among Spaces, Dashboards, and Documents left ambiguity about which concept organizes information and which merely displays it. The new direction makes these roles distinct while keeping the interface cohesive.

## Agreed direction

1. **Home is the only global/root Space.** All other Spaces are direct children of Home. No arbitrary Space nesting.
2. **Every Space, including Home, has one Library.** Library is a meaningful first-class product concept and a proposed persisted record (table shape not decided; see 02).
3. **Every Space has an Overview dashboard by default**, plus optional user-created dashboards displayed as tabs within that Space. The standalone dashboard detail/show experience should remain available; tab presentation is an additional contextual entry point, not necessarily a different entity.
4. **Home retains existing pinned documents, Spaces, dashboards, and recently accessed items** in its Overview. Those are cross-Space views; pinning does not move or duplicate items.
5. **Home can host global dashboards and widgets** such as a task board, agenda, and schedule; cross-Space widgets should also be allowed on dashboards in any other Space.
6. **A document may appear in multiple Libraries while remaining one canonical document.** Editing it from any location changes the same underlying document.
7. **The Library UI can contain more than editor-native documents**, including web references, uploaded files, and downloaded copies. `Library` is the user-facing term; `Document` can remain a concrete domain type.
8. **Moving or deleting a Space should provide ways to transfer content to another context.** Accidental loss through presentation/membership changes is undesirable.

## Working definitions

| Concept       | Intended responsibility                                      | Exclusions / caveats                                                                             |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Space         | Working context; owns dashboards and its one Library         | Not interchangeable with a dashboard; no nested Space tree beyond Home and direct children       |
| Home          | Distinguished global Space and entry point                   | Global scope does not automatically imply membership in Home Library or ownership of all content |
| Library       | Organizes and makes durable reference resources discoverable | Membership does not by itself transfer ownership                                                 |
| Document      | Native editable text/content resource                        | Can be associated with many Libraries without cloning                                            |
| File          | Managed uploaded or downloaded binary asset and its metadata | Bytes likely live in object storage, not PostgreSQL rows                                         |
| Web resource  | Link and optionally captured/downloaded content              | Original URL reference and managed copy should remain distinguishable                            |
| Dashboard     | Space-owned arrangement of visualizations/interactive views  | Does not own the resources it displays                                                           |
| Overview      | Default dashboard for a Space                                | Home Overview starts with global pin/recent widgets                                              |
| View / widget | Configured way to retrieve/display/interact with information | Reuse, placement, and copying semantics require explicit modeling                                |

## Key user flows to preserve

### Shared document

Create a document in Engineering → add the same document to Personal Learning's Library → edit from either context → both contexts show the same current content. Removing either Library membership does not delete the document.

### Space deletion / reorganization

When deleting Engineering, offer an explicit disposition for its exclusively associated or owned resources: move their organizational memberships to another Space (Home as a natural fallback), transfer ownership if needed, or intentionally delete where safe. Shared resources must not disappear merely because one referencing Space is removed.

### Home as personal overview

The Home Overview retains pinned/recent information. A user may add a global task board, agenda, or schedule aggregating data across contexts; other Spaces may host similarly global widgets rather than being restricted to local content.

### File acquisition

Add a link to a Library; optionally download and retain a managed copy. Track source/provenance and distinguish a live external reference from a stable managed artifact. Uploading local files is also supported conceptually.

## Intentional UX distinctions

- `Library` is a navigational and organizational concept; it need not replace the `Document` domain name.
- The default Overview is a dashboard, but the Space remains its own context and lifecycle owner.
- A dashboard tab chooses a view, not a separate Space.
- Pins and recents are personal/global overlays, not equivalent to Library membership.
- Home Library membership semantics remain **open**: explicit members, aggregate all accessible resources, or a combined interface.

## Scope boundaries

This is a product direction, not authorization to add tasks, calendars, file ingestion, a generic resource engine, or a full dashboard builder to the current phase. The existing MVP and phase gates still govern delivery.
