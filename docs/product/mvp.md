# MVP decision boundary

**Status:** Open product decision
**Current decision:** No first slice has been selected

## Why this document does not contain a feature list

The evidence adopts a broad product foundation but explicitly leaves the first vertical slice and implementation sequence unresolved. Selecting an MVP here would convert a generation pass into product authority it does not have.

This document is therefore the canonical process and acceptance boundary for making that decision.

## What the first slice must accomplish

The first slice must prove one coherent, user-meaningful product hypothesis end to end. It must include enough real behavior to evaluate that hypothesis without requiring the entire long-term platform.

An acceptable slice must state:

- the user problem it tests;
- the initial user and workflow;
- the smallest set of concepts required;
- the concepts intentionally excluded;
- the canonical information owner for every durable concern;
- observable success evidence;
- failure, recovery, accessibility, and destructive-action behavior;
- the implementation decisions required now;
- the future decisions it intentionally avoids;
- the trigger for continuing, revising, or abandoning the direction.

## Candidate proof questions

The evidence synthesis identifies candidate proofs without selecting among them:

- Can one canonical Document participate in multiple contexts without duplication?
- Can a user move between context and surface without losing meaningful continuity?
- Can a Dashboard present canonical information without becoming its owner?
- Can interruption-safe capture coexist with deeper work without defining the entire capture lifecycle?
- Can a meaningful internal Document target survive realistic editing?
- Can a contextual environment specialize the experience without modifying canonical identity?

These may be refined, combined, rejected, or deferred by the human product owner.

## Selection criteria

Prefer a slice that:

- addresses a founder-observed workflow rather than a repository-shaped feature list;
- exposes the highest-value unresolved product assumption;
- is small enough to implement and evaluate honestly;
- forces only the architecture decisions necessary for the proof;
- provides real persisted behavior rather than fixture-backed presentation;
- produces evidence that can change the next decision;
- remains coherent without deferred AI, collaboration, integrations, or generalized plugin infrastructure.

Avoid a slice selected primarily because:

- the previous implementation already contains polished UI for it;
- a package structure already exists;
- a generic abstraction would look architecturally complete;
- the concept has been mentioned repeatedly in descendant documents;
- a tested mechanism exists without a real consumer;
- it enables the largest amount of code reuse.

## Candidate experiment record

Before implementation, create a product decision record containing:

```markdown
# First-slice decision

Status: Proposed | Accepted | Rejected | Superseded
Owner:
Date:

## Problem and user workflow

## Hypothesis

## Included capabilities

## Explicit exclusions

## Product terminology used and its status

## Required architecture decisions

## Decisions intentionally deferred

## Success evidence

## Failure and recovery expectations

## Accessibility expectations

## Evaluation window or trigger

## Outcome

## Follow-up decision
```

## MVP exit criterion

The MVP decision is complete only when the human product owner approves:

1. one bounded proof hypothesis;
2. included and excluded capabilities;
3. observable success evidence;
4. the decision or experiment that follows each likely outcome.

Until then, agents may investigate and propose slices but must not create a repository topology that presumes one.
