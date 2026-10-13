# @synapcity/dev-fixtures

Owns: seeded fake data for tests, Storybook stories and local development, built on `@faker-js/faker`.

```ts
import { createFixtures } from '@synapcity/dev-fixtures';

const fx = createFixtures(); // default seed, reproducible
const people = fx.list(5, fx.person);
```

- **Seeded.** Every call to `createFixtures(seed)` builds its own isolated Faker instance and fixes the reference date, so output is identical across runs and across consumers.
- **Generic primitives only** (`id`, `person`, `title`, `paragraph`, `recent`, `list`). No Synapcity domain entity is modelled: the data model is undecided. Add a named factory here once an entity is accepted and named in `docs/glossary.md`.
- **Dev-only.** Declare it in `devDependencies`, and import it only from tests, stories, e2e specs and seed scripts, never from shipped app code.
- Source is exported as TypeScript (`./src/index.ts`), like the other `dev-*` packages.

## Seed file

`seed/seed.json` is a committed, deterministic seed built from the same factories (`src/seed.ts`). Regenerate it with `pnpm --filter @synapcity/dev-fixtures generate [seed]` after changing a factory, then commit it. A test fails when the file drifts from the generator. Its shape is a placeholder (a list of people) until the data model is decided; nothing consumes it yet.
