# Architecture review

1. Read the architecture principles, relevant accepted ADRs, ADR-0014, and the current-to-target ownership map. Identify whether the task touches product meaning, terminology, or implementation placement.
2. Check who owns every durable concern. UI structure does not establish domain ownership; frontend projections and fixtures do not create another durable authority.
3. Review category and runtime entry-point dependencies against ADR-0014's matrix, including transitive reachability and type/configuration/development edges. Packages never import apps. Cycles and private-source bypasses are forbidden.
4. Separate portable contracts, frontend presentation, backend operations, feature composition, and host wiring. A feature package must keep frontend and backend entry graphs isolated. Check that grouping is cohesive, without requiring a second current consumer or creating one package per component.
5. Preserve adopted behavior, security, identifiers, storage compatibility, accessibility, and meaningful tests through migration. Any compatibility bridge needs a one-way owner, consumers, removal condition, and bounded lifespan.
6. The existing web lexical architecture test covers only some direct imports. Milestone 3 implements workspace-wide direct/transitive enforcement; until then trace affected imports and public exports manually. A diagram does not prove enforcement.
7. Record consequential new decisions through the ADR and approval process. Report findings with their locations, governing rule, evidence, and verification limits.
