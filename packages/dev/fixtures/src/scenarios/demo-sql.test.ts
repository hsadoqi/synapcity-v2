import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';

import { demoWorkbench } from './demo-workbench';
import { scenarioToSql } from './demo-sql';
import type { Scenario } from './scenario';

describe('scenarioToSql', () => {
  const scenario = demoWorkbench();
  const sql = scenarioToSql(scenario);

  it('writes every row and every filing, for the owner variable only', () => {
    const count = (pattern: RegExp) => sql.match(pattern)?.length ?? 0;
    // One tuple per row begins with its quoted id and the owner variable.
    expect(count(/^ {2}\('[0-9a-f-]{36}', :'owner_id'/gm)).toBe(
      scenario.spaces.length +
        scenario.documents.length +
        scenario.dashboards.length,
    );
    expect(
      count(/^ {2}\('[0-9a-f-]{36}', '[0-9a-f-]{36}', :'owner_id'\)/gm),
    ).toBe(scenario.memberships.length);
    expect(sql).not.toContain(scenario.users[0]!.id);
  });

  it('runs in one transaction', () => {
    expect(sql).toMatch(/^begin;$/m);
    expect(sql).toMatch(/^commit;$/m);
  });

  it('escapes quotes and keeps nulls and empty arrays valid', () => {
    const tricky: Scenario = {
      ...scenario,
      spaces: [
        {
          ...scenario.spaces[0]!,
          name: "Ada's notes",
          description: undefined,
          tags: [],
          pinnedAt: null,
        },
      ],
      documents: [],
      dashboards: [],
      memberships: [],
    };
    const out = scenarioToSql(tricky);
    expect(out).toContain("'Ada''s notes'");
    expect(out).toContain("'{}'::text[]");
    expect(out).toContain('null');
    expect(out).not.toContain('public.documents');
  });
});

/*
 * `pnpm db:seed-demo` writes the SQL with this file, because the scenario
 * imports the domain packages' TypeScript source, which Vitest resolves and
 * plain `node` does not. Skipped unless SEED_DEMO_SQL names the output file.
 */
const out = process.env.SEED_DEMO_SQL;
describe.skipIf(out === undefined)('write the demo SQL', () => {
  it('writes the file', () => {
    mkdirSync(dirname(out!), { recursive: true });
    writeFileSync(out!, scenarioToSql(demoWorkbench()));
  });
});
