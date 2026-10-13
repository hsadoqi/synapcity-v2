# Implementation planning

1. Start from an investigation. Do not plan against guesses.
2. Give a recommendation for each open choice, with the reason, and make the human's decision explicit. Do not resolve a decision the human owns (`AGENTS.md` section 5).
3. Check every new tool, dependency, or version-sensitive technique in the order given in `AGENTS.md` section 7a (declared version, current upstream evidence, accepted decisions, conflicts), cite the sources, and note versions. Keep any dependency upgrade out of the plan unless it is its own approved change.
4. Order the steps so each can be verified and reverted on its own. Prefer several small pull requests.
5. Name the verification for each step, including how the new check could fail.
6. List the approval questions, and what stays deliberately undecided.
