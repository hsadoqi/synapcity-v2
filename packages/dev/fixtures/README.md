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

## Seed files

`seed/<name>.json` files are committed, deterministic seeds built from the same factories. Each is one entry in `seedDefinitions` (`src/seed.ts`): the key is the file name, the value builds its rows from a seeded `Fixtures`.

```sh
pnpm --filter @synapcity/dev-fixtures generate            # every seed
pnpm --filter @synapcity/dev-fixtures generate users      # one seed
pnpm --filter @synapcity/dev-fixtures generate users 42   # one seed, another RNG seed
```

To add a kind of seed, add a `seedDefinitions` entry and run `generate`. A test per entry fails when a committed file drifts from its definition (it checks the default seed, so commit files generated without a seed argument). Files are exported as `@synapcity/dev-fixtures/data/<name>`. The shapes are placeholders until the data model is decided; nothing consumes them yet.
