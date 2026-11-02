# @synapcity/dev-fixtures

**Reorganization target:** [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md) and the [dev umbrella](../README.md) extend this existing package with contract-backed factories, coherent scenarios, and sample content. Product copy belongs to its feature; real records come through authorized server repositories. This package is not the source of all application data or copy.

Owns: seeded fake data for tests, Storybook stories and local development, built on `@faker-js/faker`.

```ts
import { createFixtures } from '@synapcity/dev-fixtures';

const fx = createFixtures(); // default seed, reproducible
const people = fx.list(5, fx.person);
```

- **Seeded.** Every call to `createFixtures(seed)` builds its own isolated Faker instance and fixes the reference date, so output is identical across runs and across consumers.
- **Current factories.** The package includes generic primitives (`id`, `person`, `title`, `paragraph`, `recent`, `list`) and contract-backed record factories (`space`, `documentRecord`, `dashboardRecord`, also exported stand-alone as `createSpace`, `createDocumentRecord`, `createDashboardRecord`, `createPerson`), each returning a fresh object with its own id, string icon and ISO timestamps (`createdAt` ≤ `updatedAt`), parsed by the domain schema, plus `createSpaceEntity(overrides)`, a Space record validated with `@synapcity/domain-spaces`' `spaceSchema` (M5.4). These are implementation fixtures, not authority for product terminology or schemas. Align them with their domain contract owner as those contracts move; presentation-only samples stay explicitly identified.
- **Prototype workspace.** `@synapcity/dev-fixtures/prototype-workspace` exports `createPrototypeWorkspace(now)`, which builds the responsive-grid prototype's sample dashboard and records from `@synapcity/domain-prototypes` and `@synapcity/domain-dashboards`, with `simulateTick` for its mock live data. Simulations sit beside the records, keyed by id, so they never ride on a record.
- **No credentials in the data.** `person` has no `password`: committed seed JSON with a `password` key trips CI's secret scan (gitleaks `generic-api-key`) however fake the value is. A test that needs one sets it inline, as an override.
- **Dev-only.** Declare it in `devDependencies`, and import it only from tests, stories, e2e specs and seed scripts, never from shipped production app code. An explicit demo host must isolate synthetic providers from production composition; a demo success is not evidence of persistence.
- Source is exported as TypeScript (`./src/index.ts`), like the other `dev-*` packages.

## Seed files

`seed/<name>.json` files are committed, deterministic seeds built from the same factories. Each is one entry in `seedDefinitions` (`src/seed.ts`): the key is the file name, the value builds its rows from a seeded `Fixtures`.

```sh
pnpm --filter @synapcity/dev-fixtures generate                       # every seed
SEED_NAME=users pnpm --filter @synapcity/dev-fixtures generate        # one seed
SEED_NAME=users SEED=7 pnpm --filter @synapcity/dev-fixtures generate # one seed, another RNG seed
```

To add a kind of seed, add a `seedDefinitions` entry and run `generate`. Seed-file generation defaults to **42**, matching the checked-in files; `createFixtures()` keeps its independent default of **1**. A test per entry fails when a committed file's parsed JSON data drifts from its definition (using seed 42, so commit files generated without a seed argument). JSON whitespace is checked by Prettier. Files are exported as `@synapcity/dev-fixtures/data/<name>`. Seed shapes are fixture representations and do not settle product contracts. Consumers and production/demo separation must be inventoried in the scoped fixture migration.

## Known migration inputs

The record factories no longer carry rendering-specific icons, `Date` objects or a shared default identity (F6a). The seed file `workspaces.json` keeps its historical name while its rows are Space records. Scenarios (coherent cross-record graphs) are F6b; the committed JSON seeds still have no consumer and are removed only by a separately approved cleanup.

Keep fixtures out of production dependency graphs. A domain package must not import a fixture package that depends on that domain package; keep small independent test inputs local when necessary to avoid a cycle. See the [ownership map](../../../docs/architecture/reorganization-ownership-map.md) for source assignments and transition cases.
