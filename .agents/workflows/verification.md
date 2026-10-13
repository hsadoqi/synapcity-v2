# Verification

1. Run `pnpm verify` and report the real result.
2. Say what it does not prove. With no source or tests, or an empty package set, a pass proves the tools run, not product behavior.
3. For any new check, prove it can fail: give it a deliberate violation and confirm it reports it, and disable the rule to confirm the test notices. Label fixture-based checks self-consistent.
4. Check the form real code will take, not only a convenient one (for example resolved package paths, not only unresolved imports).
5. For workflow or CI changes, the real run on the pull request is the proof. Local syntax checks are not.
6. Report using the Definition of Done: what ran and passed, what failed, what was not run, and what remains unverified. Never call something verified because it looks consistent.
