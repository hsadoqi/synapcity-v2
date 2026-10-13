# User-facing documentation in `apps/docs`

**Status:** Proposed. A review artifact, not governing architecture. Nothing here is approved or implemented.

**Decision needed:** "Documentation site content and tooling for `apps/docs`" is an open item in ADR-0001 and in the ADR candidate list (`docs/architecture/decisions/README.md`). Choosing the tooling needs the repository owner's approval and, for anything other than plain pages, an ADR.

## Where things stand

`apps/docs` is a placeholder with one page. Its README says no documentation content exists yet. It shares the token, font and component rules of `apps/web` (ADR-0002, ADR-0003), so any option below must not introduce its own theme or font stack.

## Tooling options

| Option                             | New dependency          | Fit with ADR-0002 token rules                  | Cost                                            | Needs ADR |
| ---------------------------------- | ----------------------- | ---------------------------------------------- | ----------------------------------------------- | --------- |
| Plain TSX pages, one route per doc | None                    | Full; uses the shared components               | Prose is verbose to write                       | No        |
| MDX through `@next/mdx`            | Yes, plus config change | Full, if MDX elements map to shared components | Needs a components map and a config change      | Yes       |
| A docs framework                   | Yes, largest            | Unknown; may bring its own styling             | Search and navigation included; hardest to undo | Yes       |

**Recommendation:** start with plain TSX pages. They add no dependency, work with the shared components as they are, and the page text below moves unchanged into MDX later if the tooling decision goes that way. This is a recommendation, not a decision.

**Not verified:** The framework row has not been checked against current upstream documentation or the installed versions (see `AGENTS.md` §7a). Treat it as a question to answer before that option is considered, not as evidence.

## First page: light, dark and system mode

The text below is a draft for review. It describes behavior that exists today and avoids product vocabulary that the glossary marks as open.

---

### Choose light, dark or system mode

Synapcity can show a light or a dark appearance, or follow your device.

**Change the mode**

1. Select the mode button, the sun and moon icon.
2. Choose **Light**, **Dark** or **System**.

The page changes immediately.

**What each option does**

- **Light** always uses the light appearance.
- **Dark** always uses the dark appearance.
- **System** follows your device. If your device switches to dark in the evening, Synapcity switches with it.

**Your choice is remembered** in your browser, so it is still there when you come back. Each Synapcity site remembers its own choice, so you may need to set the mode once on each one. Clearing your browser's site data, or using a private window, resets it to System.

---

## Open questions

- Which tooling option, and who approves it.
- Whether user-facing pages and the contributor docs under `docs/` stay separate. Contributor docs are Markdown in the repository and are not published by `apps/docs`.
- Whether a page that describes a UI control should be tested by hand or by a story test, since the shared test setup does not yet cover docs pages. The draft above has not been checked against the running app.
- Where the mode button sits on each page. The draft deliberately does not say.

## Consequences if adopted

`apps/docs/README.md` ("Today it is a placeholder") and `docs/architecture/README.md` (which says `designs/` is empty) would need updating. This proposal changes neither.
