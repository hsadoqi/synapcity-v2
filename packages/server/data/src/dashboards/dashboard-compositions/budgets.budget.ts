/*
 * Pass/fail budgets for Dashboard history (S1), measured on a disposable local
 * stack. They are gates, not informational numbers: a miss fails the run.
 * They seed hundreds of megabytes, so they are their own run:
 * `pnpm --filter @synapcity/server-data test:db:budgets`.
 *
 *   B-1 (V-7)  A save that checkpoints AND prunes adds at most 50 ms at p95
 *              (100 runs) over a save that does neither, on a Dashboard that
 *              holds 500 revisions of 64 KiB compositions.
 *   B-2 (V-8)  Deleting the heavy account (50 Dashboards x 500 revisions of
 *              16 KiB, 20 Spaces with memberships) takes at most 50% of the
 *              lowest statement_timeout that applies to the caller, in each of
 *              5 runs after one warm-up. The maximum of the 5 is compared, not
 *              a percentile.
 *
 * Every figure is the wall-clock time of one statement round trip through a
 * `psql` session, as a client would wait for it. Seeding bypasses the capture
 * triggers (rows are inserted directly) so the shape of the data is exact.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { cpus, platform, release, totalmem } from 'node:os';

import { describe, expect, it } from 'vitest';

import { createRecord } from '../../records';
import {
  withSessions,
  withTwoUsers,
  type PsqlSession,
  type TestUser,
} from '../../testing/db';

const LOCAL_STATEMENT_TIMEOUT_MS = 8_000; // `authenticated` here; see the S1 spec
const B2_LIMIT_MS = LOCAL_STATEMENT_TIMEOUT_MS * 0.5;
const B1_LIMIT_MS = 50;

function stats(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const pct = (p: number) =>
    sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)]!;
  const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
  const sd = Math.sqrt(
    samples.reduce((s, x) => s + (x - mean) ** 2, 0) / samples.length,
  );
  return {
    n: samples.length,
    min: sorted[0]!,
    median: pct(0.5),
    p95: pct(0.95),
    max: sorted.at(-1)!,
    mean,
    sd,
  };
}

const r = (n: number) => Math.round(n * 10) / 10;

function environment(serverVersion: string) {
  const sh = (cmd: string, args: string[]) => {
    try {
      return execFileSync(cmd, args, { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  };
  return {
    machine: `${cpus()[0]?.model ?? 'unknown cpu'} x${cpus().length}, ${(totalmem() / 2 ** 30).toFixed(0)} GiB RAM`,
    os: `${platform()} ${release()}`,
    docker: sh('docker', [
      'info',
      '--format',
      'Docker {{.ServerVersion}}, {{.NCPU}} cpus, {{.MemTotal}} bytes for the VM',
    ]),
    supabaseCli: sh('pnpm', ['exec', 'supabase', '--version']).split('\n')[0],
    postgres: serverVersion,
  };
}

function report(name: string, body: unknown) {
  const line = JSON.stringify({ budget: name, ...(body as object) });
  console.info(line);
  if (process.env.DB_BUDGET_REPORT)
    appendFileSync(process.env.DB_BUDGET_REPORT, `${line}\n`);
}

async function serverVersion(): Promise<string> {
  return withSessions(1, async ([s]) =>
    (await s!.run('show server_version')).out.trim(),
  );
}

/** A session acting as `user` the way PostgREST would: the authenticated role with their claims. */
async function asUser(
  session: PsqlSession,
  user: TestUser,
  withEmailLink = false,
) {
  const claims = {
    sub: user.id,
    role: 'authenticated',
    ...(withEmailLink
      ? { amr: [{ method: 'otp', timestamp: Math.floor(Date.now() / 1000) }] }
      : {}),
  };
  await session.run(
    `select set_config('request.jwt.claims', '${JSON.stringify(claims)}', false)`,
  );
  await session.run(
    `select set_config('request.jwt.claim.sub', '${user.id}', false)`,
  );
  await session.run('set role authenticated');
  await session.run(
    `set statement_timeout = '${LOCAL_STATEMENT_TIMEOUT_MS}ms'`,
  );
}

describe('B-1: revision capture and pruning cost (V-7)', () => {
  it('a checkpointing, pruning save adds at most 50 ms at p95 over a save that does neither', async () => {
    await withTwoUsers(async (a) => {
      const created = await createRecord(a.client, 'dashboards', {
        name: 'B-1',
      });
      if (!created.ok) throw new Error('create failed');
      const id = created.id;

      await withSessions(2, async ([admin, client]) => {
        // 499 more revisions of ~64 KiB each, directly (the initial one exists).
        const seeded = await admin!.run(`
          insert into public.dashboard_revisions
            (dashboard_id, owner_id, sequence, source, schema_version, composition,
             name, description, icon, tags, content_bytes, content_hash, created_by)
          select '${id}', '${a.id}', g, 'checkpoint', 1,
                 jsonb_build_object('pad', (select string_agg(md5(g::text || i::text), '') from generate_series(1, 2000) i)),
                 'B-1', null, 'layout-dashboard', '{}', 64000,
                 sha256(convert_to(g::text, 'UTF8')), '${a.id}'
            from generate_series(2, 500) g`);
        expect(seeded.err).toBe('');
        const count = await admin!.run(
          `select count(*) from public.dashboard_revisions where dashboard_id = '${id}'`,
        );
        expect(count.out.trim()).toBe('500');
        // The cap is 500, so every capture now prunes exactly one revision.

        await asUser(client!, a);
        let revision = 1;
        const save = async () => {
          revision += 1;
          const text = await admin!.run(`select 1`); // keep the admin session warm
          void text;
          const started = performance.now();
          const result = await client!.run(
            `update public.dashboard_compositions
                set composition = jsonb_build_object('pad', (select string_agg(md5(random()::text || i::text), '') from generate_series(1, 2000) i)),
                    revision = ${revision}
              where dashboard_id = '${id}' returning revision`,
          );
          const elapsed = performance.now() - started;
          expect(result.err).toBe('');
          expect(result.out.trim()).toBe(String(revision));
          return elapsed;
        };
        const age = (minutes: number) =>
          admin!
            .run('set session_replication_role = replica')
            .then(() =>
              admin!.run(
                `update public.dashboard_compositions set updated_at = now() - interval '${minutes} minutes' where dashboard_id = '${id}'`,
              ),
            )
            .then(() => admin!.run('set session_replication_role = origin'));

        await save(); // warm-up

        const neither: number[] = [];
        const both: number[] = [];
        for (let i = 0; i < 100; i += 1) {
          // Fresh write just now: inside the gap, so no capture and no prune.
          await age(0);
          neither.push(await save());
          // Quiet for ten minutes: the pre-image is captured and the oldest pruned.
          await age(10);
          both.push(await save());
        }

        const revisions = await admin!.run(
          `select count(*) from public.dashboard_revisions where dashboard_id = '${id}'`,
        );
        expect(revisions.out.trim()).toBe('500'); // pruned back to the cap each time

        const n = stats(neither);
        const b = stats(both);
        const addedP95 = b.p95 - n.p95;
        const bytes = await admin!.run(
          `select pg_size_pretty(pg_total_relation_size('public.dashboard_revisions')), sum(content_bytes) from public.dashboard_revisions where dashboard_id = '${id}'`,
        );
        report('B-1', {
          runs: 100,
          neither: {
            min: r(n.min),
            median: r(n.median),
            p95: r(n.p95),
            max: r(n.max),
            sd: r(n.sd),
          },
          checkpointAndPrune: {
            min: r(b.min),
            median: r(b.median),
            p95: r(b.p95),
            max: r(b.max),
            sd: r(b.sd),
          },
          addedAtP95Ms: r(addedP95),
          limitMs: B1_LIMIT_MS,
          onDiskVersusLogical: bytes.out.trim(),
          environment: environment(await serverVersion()),
          cache:
            'warm: seeded immediately before, same session sequence; cold cache not measured',
        });
        expect(addedP95).toBeLessThanOrEqual(B1_LIMIT_MS);
      });
    });
  }, 600_000);
});

describe('B-2: deleting the heavy account (V-8)', () => {
  async function seedHeavyAccount(admin: PsqlSession, user: TestUser) {
    const seeded = await admin.run(`
      with d as (
        insert into public.dashboards (owner_id, name)
        select '${user.id}', 'Heavy ' || g from generate_series(1, 50) g
        returning id
      ), s as (
        insert into public.spaces (owner_id, name)
        select '${user.id}', 'Heavy space ' || g from generate_series(1, 20) g
        returning id
      )
      select (select count(*) from d), (select count(*) from s)`);
    expect(seeded.err).toBe('');
    // 499 more revisions per Dashboard, 16 KiB each (the initial one exists).
    const revisions = await admin.run(`
      insert into public.dashboard_revisions
        (dashboard_id, owner_id, sequence, source, schema_version, composition,
         name, description, icon, tags, content_bytes, content_hash, created_by)
      select d.id, '${user.id}', g, 'checkpoint', 1,
             jsonb_build_object('pad', (select string_agg(md5(d.id::text || g::text || i::text), '') from generate_series(1, 512) i)),
             d.name, null, d.icon, d.tags, 16384,
             sha256(convert_to(d.id::text || g::text, 'UTF8')), '${user.id}'
        from public.dashboards d
        cross join generate_series(2, 500) g
       where d.owner_id = '${user.id}'`);
    expect(revisions.err).toBe('');
    // Memberships: each Dashboard in two Spaces.
    const members = await admin.run(`
      insert into public.space_dashboards (space_id, dashboard_id, owner_id)
      select s.id, d.id, '${user.id}'
        from (select id, row_number() over () rn from public.spaces where owner_id = '${user.id}') s
        join (select id, row_number() over () rn from public.dashboards where owner_id = '${user.id}') d
          on (d.rn % 20) = (s.rn % 20) or ((d.rn + 7) % 20) = (s.rn % 20)`);
    expect(members.err).toBe('');
    const counts = await admin.run(`
      select (select count(*) from public.dashboard_revisions where owner_id = '${user.id}'),
             (select count(*) from public.space_dashboards where owner_id = '${user.id}')`);
    return counts.out.trim();
  }

  it('each of 5 runs after a warm-up finishes within 50% of the lowest applicable statement timeout', async () => {
    const all: { run: string; ms: number }[] = [];
    let fixture = '';

    for (const label of ['warm-up', '1', '2', '3', '4', '5']) {
      await withTwoUsers(async (a) => {
        await withSessions(2, async ([admin, client]) => {
          fixture = await seedHeavyAccount(admin!, a);
          await admin!.run('checkpoint'); // the seed's dirty pages are written out first
          await asUser(client!, a, true);

          const started = performance.now();
          const result = await client!.run(
            'select public.delete_own_account()',
          );
          const elapsed = performance.now() - started;
          expect(result.err, `run ${label}`).toBe('');

          const left = await admin!.run(
            `select (select count(*) from public.dashboard_revisions where owner_id = '${a.id}'),
                    (select count(*) from public.dashboards where owner_id = '${a.id}'),
                    (select count(*) from auth.users where id = '${a.id}')`,
          );
          expect(left.out.trim()).toBe('0|0|0'); // nothing orphaned
          all.push({ run: label, ms: elapsed });
        });
      });
    }

    const measured = all.filter((x) => x.run !== 'warm-up').map((x) => x.ms);
    const s = stats(measured);
    report('B-2', {
      fixture: `50 dashboards x 500 revisions x 16 KiB, 20 spaces; seeded rows (revisions|memberships): ${fixture}`,
      warmUpMs: r(all[0]!.ms),
      measuredMs: measured.map(r),
      min: r(s.min),
      median: r(s.median),
      max: r(s.max),
      standardDeviation: r(s.sd),
      limitMs: B2_LIMIT_MS,
      statementTimeoutMs: LOCAL_STATEMENT_TIMEOUT_MS,
      stack:
        'seeded and deleted within one stack lifetime; one warm-up run preceded; shared_buffers 128MB; pages recently written (warm), cold cache not measured',
      environment: environment(await serverVersion()),
    });
    expect(s.max).toBeLessThanOrEqual(B2_LIMIT_MS);
  }, 1_800_000);
});
