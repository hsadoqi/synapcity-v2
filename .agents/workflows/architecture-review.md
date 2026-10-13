# Architecture review

1. Read `docs/architecture/principles.md` and the ADRs the change touches.
2. Ask, for each new durable thing: who owns it (principles 1 and 2), is the ownership inferred from UI structure (principle 3), and is anything decided that an ADR or the candidate list marks open (principle 8)?
3. Check the workspace layout (ADR-0001) and styling ownership (ADR-0002). No tool enforces dependency direction today, so check by reading imports: apps depend on packages, never the reverse, with no cycles.
4. Check that a decision with lasting consequences has an ADR, and that its "does not decide" and "unresolved" sections are honest.
5. Report findings by severity, each with the file and the principle or ADR it conflicts with.
