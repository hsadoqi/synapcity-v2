# Planning artifacts

Use this workflow before creating or changing implementation plans, task files, issues, issue hierarchies, labels, milestones, project fields, backlog records, or any other planning surface. It governs both repository-local artifacts and external systems.

## 1. Establish ownership and readiness

1. Name one system of record for each concern: decisions, implementation sequence, execution tasks, status, dependencies, milestones, and completion state.
2. Treat a second planning surface as a new governance system, not as a harmless copy. Define what it alone owns, how it reconciles with the existing system, and who maintains that boundary; otherwise do not create it.
3. Verify source readiness before deriving artifacts. Read the approved source plan or decision, confirm its status and exact path, and confirm that any referenced repository, project, field, option, issue, or tool workspace exists.
4. If the source is missing, provisional when approval is required, internally conflicting, or located somewhere other than the requested destination, stop and report the mismatch. Do not create a substitute source or continue from memory.

## 2. Prepare an external mutation preflight

Before any mutation, complete `.agents/task-scope.md` and present a manifest that names:

- every system and exact destination;
- each artifact to create, update, move, rename, delete, link, close, or otherwise mutate;
- the exact fields and values involved;
- numeric budgets for every artifact class, including explicit zeroes;
- the system of record for each concern and any approved duplication boundary;
- preconditions and source-readiness evidence;
- verification read-backs and a per-system recovery path.

Example:

```text
Create: repository plan files 1; GitHub issues 9; local task files 0
Update: existing issues 0; milestones 0; labels 0; project fields 9
Delete/move/rename/close: 0
Systems of record: sequence = repository plan; execution status = GitHub Project
```

An omitted mutation class is forbidden. Words such as "organize," "set up," "mirror," or "break down" do not authorize an unbounded number of artifacts.

## 3. Resolve tool-layout conflicts without substitution

Treat a tool's current schema and available values as observed state, not permission to redesign it.

- If a requested field, option, hierarchy, relationship type, path, or destination does not exist, stop and report the exact absence.
- Do not silently select a closest value, create a replacement taxonomy, add a field or option, change a project layout, or encode the value elsewhere.
- If the tool cannot represent the approved structure exactly, present the conflict and bounded options. Wait for the human to choose.
- Tool convenience, reversibility, and an API's acceptance of a value do not expand authority.

## 4. Use two-phase execution

### Phase A — proposal

Investigate read-only, produce the completed task scope and mutation manifest, surface conflicts, and request approval. No planning artifact is created or changed in this phase.

### Approval gate

Approval must cover the current manifest, budgets, destinations, systems of record, and recovery paths. Approval of a concept or plan is not approval of every available tool action.

### Phase B — execution

Execute only the approved manifest. Count artifacts against the budget as they are mutated, verify each system through a read-back, and stop at the first mismatch. Do not spend unused budget on additional "helpful" structure.

If the manifest, destination, tool layout, or required mutation class changes, return to Phase A. Never repair a mismatch by broadening the mutation set on the fly.

## 5. Stop and recover

Stop immediately when:

- a precondition or source-readiness check fails;
- an exact destination, field, option, or requested value is missing;
- a budget would be exceeded;
- two systems claim the same concern without an approved ownership boundary;
- observed external state differs from the approved manifest;
- a human objects, says stop, or corrects a path or scope.

On a human correction, follow `.agents/README.md`'s reset protocol. Report the current cross-system state and offer exact recovery options; do not finish the batch, move or rename artifacts, defend the interpretation, or clean up without new approval.

## 6. Verify and report

Read back every affected system and compare the result to the approved manifest and budgets. Report exact counts, destinations, field values, verification performed, anything not verified, partial failures, remaining artifacts, and the safest recovery action. Repository checks do not verify external state, and an external read-back does not verify repository documentation.
