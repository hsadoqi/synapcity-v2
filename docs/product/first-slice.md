# First-slice decision

Status: Accepted
Owner: Hanaa (product owner)
Date: 2026-10-17

The product owner chose **quick capture** as the first slice on 2026-10-17, from three candidates (shared documents across contexts, quick capture, a dashboard of live documents). This record turns that choice into the bounded proof that `docs/product/mvp.md` requires. The owner accepted this record as written on 2026-10-17, including every default marked **Owner decision**. Those markers stay so a later change to one of them is easy to find.

## Problem and user workflow

Work is interrupted by passing thoughts: a task to remember, an idea for another piece of work, a link to look at later. Today the cost of keeping that thought is high. The person either leaves what they are doing to put it somewhere, chooses a destination they will later regret, or keeps it in their head and loses it.

The workflow under test, for the founder as the single initial user:

1. The founder is writing in a Document.
2. A thought arrives. Without leaving the Document, they open the application-level utility panel from the shell, type the thought and save it.
3. The panel closes or stays open, and they are back exactly where they were: same Document, same caret position, same scroll position.
4. Later, they open the panel, see what they captured and still have to deal with, and resolve each capture.

## Hypothesis

If capture is available from the persistent shell, takes one shortcut and a line of text, never asks for a destination, and never moves the person away from their current work, then the founder will capture inside Synapcity during real work instead of using another tool, and will come back and resolve those captures.

## Included capabilities

1. **Minimal Documents.** Create a Document, give it a title, write in it with Lexical (paragraphs, headings, lists, bold, italic, links), and see a list of Documents. Content is saved on the server. This exists so there is real work to interrupt and a place a capture can become.
2. **Persistent shell.** A signed-in frame around the work that carries navigation to the Document list and the control that opens the utility panel.
3. **Application-level utility panel** (working label: Global Panel). It opens from the shell control or a keyboard shortcut, expands vertically, and reflows the current work instead of covering it. It can be resized, dismissed and locked open. Locked state and width are remembered for the signed-in user.
4. **Capture.** A text field in the panel. Saving creates a durable capture on the server without asking for a destination. The text the person typed is never lost, even when the save fails.
5. **Revisit.** The panel lists open captures, newest first, with when each was captured and from which Document, if any (provenance).
6. **Resolve.** Each open capture can be:
   - **turned into a new Document**, whose first content is the capture's text, and the capture records which Document it became;
   - **dismissed**, which hides it from the open list but keeps it recoverable from a dismissed list, with undo right after the action.

## Explicit exclusions

- Spaces or any other user-defined context. Everything in this slice is global.
- Adding a capture to an existing Document. **Owner decision:** excluded by default to keep the slice small; include it if "turn into a new Document" alone feels wrong in use.
- Connections, references, links between Documents, and search.
- Dashboards and Widgets, Global Home, and the Document contextual sidebar.
- Version history and restoration for Documents.
- Permanent deletion of captures or Documents. Dismissal is the only removal in this slice.
- Images, files, voice, or anything other than text in a capture.
- Automatic classification, AI, reminders, notifications and scheduling.
- Offline capture and sync. Failure is handled (see below), but captures are only durable once the server confirms them.
- Mobile layouts beyond the app staying usable at narrow widths.

## Product terminology used and its status

All from `docs/glossary.md`. None of these labels is adopted as a name by this record.

| Label used here                               | Glossary status                                     | Effect on this slice                                                                                                                   |
| --------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Document                                      | Strong working term                                 | Used in the interface. Schema and routes still need the naming process before code.                                                    |
| Capture                                       | Strong working verb/noun; lifecycle noun unresolved | Used as the verb and the interface label. The noun for a stored capture needs a naming decision before a table or type is named.       |
| Application-level utility panel, Global Panel | Descriptive concept; "Global Panel" is provisional  | Interface copy should not name the panel until a term is chosen. It can be opened by an icon with an accessible label such as Capture. |
| Note                                          | Semantically contaminated                           | Not used anywhere in this slice, including code.                                                                                       |
| Provenance                                    | Strong working term                                 | Used only for "captured from this Document" and "became this Document".                                                                |
| `CaptureItem` and the inbox lifecycle         | Experimental, not adopted                           | Not carried over. The lifecycle below is a new proposal.                                                                               |

## Required architecture decisions

These must be settled, each with owner approval and an ADR where `docs/architecture/decisions/README.md` asks for one, before implementation starts:

1. **Capture lifecycle (product).** Proposed default: a capture is its own lightweight record with two states, open and resolved, and a resolution of either "became Document X" or "dismissed". It is not a Document and not a draft. The alternative, capture creating a Document directly, is rejected for this slice because it fills the Document list with fragments and removes the "decide later" step the hypothesis depends on. **Owner decision.**
2. **Persistence and API.** Proposed: Supabase Postgres, which the app already uses for profiles, with row-level security so each user reads only their own rows, and Next.js server actions as the write path. This resolves part of the open "persistence, API, routing and state management" candidate and needs an ADR.
3. **Document storage.** Proposed: the Lexical editor state stored as JSON per Document, saved with a short debounce, plus a plain-text title. The node set is the minimum listed above. This decides a first persistence envelope, not the long-term Document schema.
4. **Routing.** A route for the Document list and one for a single Document under the signed-in area. Segment names follow the naming process in `docs/glossary.md`.
5. **Panel state.** Open, locked and width state live on the client and are saved per user. Proposed: on the profile row, so they follow the user across browsers.
6. **New dependencies.** Lexical (founder-confirmed direction, not yet installed). No other new dependency is expected.

## Decisions intentionally deferred

- The final names for the panel, a stored capture, and Documents' routes and tables beyond what the naming process approves for this slice.
- Capture outcomes other than "new Document" and "dismissed".
- Document deletion, archival and restoration semantics.
- Search, relevance and "Continue" semantics.
- Spaces, and whether a capture made inside a Space defaults into it.
- Whether the Document contextual sidebar shares primitives with the panel.
- Long-term Document schema, import and export.

## Success evidence

Automated, before the slice is called done:

- An end-to-end test that types in a Document, opens the panel, captures, closes the panel, and continues typing: the Document text, caret and scroll position are unchanged.
- A test that a capture survives a reload, and that turning it into a Document creates that Document with the capture's text and records the link.
- A test that a failed save leaves the typed text in the field with an error, and that retry succeeds.
- Storybook stories with axe checks for the panel, the capture field and the capture list.

In use, over the evaluation window:

- The founder captures inside Synapcity during real work, at least a few times a week, without falling back to another tool for passing thoughts.
- Most captures are resolved (turned into a Document or dismissed) within a week of being made, instead of piling up.
- The founder reports that capturing did not cost them their place in the work they were doing.

**Owner decision:** the exact thresholds. This draft leaves them qualitative because the evaluation is one person's use.

## Failure and recovery expectations

- Typed capture text is kept on the client until the server confirms the save. A failed save shows an error next to the field and a retry action. Closing the panel with unsaved text keeps it as a draft in the field.
- Document edits that fail to save show an unsaved state in the Document and retry. The interface never claims "saved" before the server confirms (product principle 16).
- Dismissing a capture offers undo immediately and can be reversed later from the dismissed list.
- Turning a capture into a Document is not destructive: the capture stays, resolved, with a link to the new Document.
- No action in this slice deletes data permanently.

## Accessibility expectations

Target WCAG 2.2 AA.

- The panel is a labelled landmark region beside the work, not a modal dialog, and does not trap focus.
- A keyboard shortcut opens the panel and moves focus to the capture field. Escape closes it and returns focus to where it was, including the editor caret.
- Saving announces the result through a polite live region.
- Resizing works from the keyboard as well as by dragging.
- Motion for opening and closing respects reduced-motion preferences.
- Everything in the slice is usable with keyboard only and with a screen reader, and meets contrast through the existing theme tokens.

## Evaluation window or trigger

Two weeks of the founder's own use, starting when the slice is deployed somewhere the founder can use it daily. **Owner decision:** the length, and whether a deployment target is needed for it (deployment topology is still an open candidate).

At the end of the window:

- **Continue** if the founder captured during real work and resolved most captures. The next decision is the second slice; capture's next outcome ("add to an existing Document") or shared Documents across Spaces are the leading candidates.
- **Revise** if captures were made but piled up unresolved. The resolution flow, not capture itself, is the problem; revisit how and where open captures resurface.
- **Abandon or rethink** if the founder kept using another tool for passing thoughts. Find out why before building more capture.

## Outcome

Not yet evaluated.

## Follow-up decision

After acceptance: write the ADRs listed under "Required architecture decisions", run the naming process for the terms this slice must name in code, and then plan implementation.
