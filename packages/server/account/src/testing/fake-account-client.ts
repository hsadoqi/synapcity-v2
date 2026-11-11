/*
 * A small stateful stand-in for the request client, for this package's unit
 * tests only: one `profiles` row, the caller's objects in the `avatars` bucket,
 * the `delete_own_account` RPC and the few Auth calls the account code makes.
 * Filters behave as PostgREST's do for the forms this package uses, so a
 * compare-and-set write really matches nothing when the row has moved on.
 *
 * Every client made by `clientWith(gate)` shares one store. `gate(label)` runs
 * before each operation, so a test can hold one save at an exact step while
 * another runs, and replay the concurrent sequences of the server remediation
 * plan deterministically. `fail(label, error)` makes the next operation with
 * that label fail once; `lost` applies the write first and loses the answer.
 */
import type { SupabaseServerClient } from '@synapcity/server-supabase';

export type FakeRow = {
  avatar_url: string | null;
  account_deletion_started_at: string | null;
};

export type FakeObject = { path: string; createdAt: number };

export type OperationLabel =
  | 'profiles.select'
  | 'profiles.update'
  | 'storage.upload'
  | 'storage.list'
  | 'storage.remove'
  | 'rpc.delete_own_account'
  | 'auth.getClaims'
  | 'auth.getUser'
  | 'auth.signOut';

export type Gate = (label: OperationLabel) => Promise<void> | void;

type Failure = { error: unknown; lost: boolean };

export const PUBLIC_BASE =
  'https://project.test/storage/v1/object/public/avatars/';

const DELETION_WINDOW_MS = 15 * 60 * 1000;

export function fakeAccountStore(options: {
  userId: string;
  row?: FakeRow | null;
  objects?: FakeObject[];
  now: () => number;
  claims?: Record<string, unknown> | null;
  user?: Record<string, unknown>;
}) {
  const { userId, now } = options;
  const state = {
    row:
      options.row === undefined
        ? ({ avatar_url: null, account_deletion_started_at: null } as FakeRow)
        : options.row,
    objects: new Map(
      (options.objects ?? []).map((object) => [object.path, object]),
    ),
    accountExists: true,
    uploads: [] as { path: string; cacheControl?: string }[],
    calls: [] as OperationLabel[],
  };
  const failures = new Map<OperationLabel, Failure[]>();

  async function step(
    label: OperationLabel,
    gate: Gate | undefined,
  ): Promise<Failure | undefined> {
    await gate?.(label);
    state.calls.push(label);
    return failures.get(label)?.shift();
  }

  const markerActive = () => {
    const marker = state.row?.account_deletion_started_at;
    return Boolean(marker) && now() - Date.parse(marker!) < DELETION_WINDOW_MS;
  };

  const removeAccount = () => {
    state.accountExists = false;
    state.row = null;
  };

  function selectBuilder(columns: string, gate: Gate | undefined) {
    let idFilter: unknown;
    const builder = {
      eq(column: string, value: unknown) {
        if (column === 'id') idFilter = value;
        return builder;
      },
      async maybeSingle() {
        const failed = await step('profiles.select', gate);
        if (failed) return { data: null, error: failed.error };
        if (!state.row || idFilter !== userId)
          return { data: null, error: null };
        const picked: Record<string, unknown> = {};
        for (const column of columns.split(',').map((c) => c.trim())) {
          picked[column] = state.row[column as keyof FakeRow];
        }
        return { data: picked, error: null };
      },
    };
    return builder;
  }

  function orTest(expression: string) {
    const parts = expression.split(',').map((part) => {
      const [column, op, ...rest] = part.split('.');
      return {
        column: column as keyof FakeRow,
        op,
        raw: rest.join('.').replace(/^"|"$/g, ''),
      };
    });
    return (row: FakeRow) =>
      parts.some(({ column, op, raw }) => {
        const value = row[column];
        if (op === 'is' && raw === 'null') return value === null;
        if (op === 'lt') {
          return value !== null && Date.parse(value) < Date.parse(raw);
        }
        throw new Error(`fake: unsupported filter ${column}.${op}`);
      });
  }

  function updateBuilder(values: Partial<FakeRow>, gate: Gate | undefined) {
    const tests: ((row: FakeRow) => boolean)[] = [];
    const builder = {
      eq(column: string, value: unknown) {
        tests.push((row) =>
          column === 'id'
            ? value === userId
            : row[column as keyof FakeRow] === value,
        );
        return builder;
      },
      is(column: string, value: null) {
        tests.push((row) => row[column as keyof FakeRow] === value);
        return builder;
      },
      or(expression: string) {
        tests.push(orTest(expression));
        return builder;
      },
      async select() {
        const failed = await step('profiles.update', gate);
        const apply = () => {
          const row = state.row;
          if (!row || !tests.every((test) => test(row))) return [];
          Object.assign(row, values);
          if (values.account_deletion_started_at) {
            // The database stamps the marker with its own clock.
            row.account_deletion_started_at = new Date(now()).toISOString();
          }
          return [{ id: userId }];
        };
        if (failed?.lost) {
          apply();
          return { data: null, error: failed.error };
        }
        if (failed) return { data: null, error: failed.error };
        return { data: apply(), error: null };
      },
    };
    return builder;
  }

  function bucket(gate: Gate | undefined) {
    return {
      async upload(
        path: string,
        _bytes: unknown,
        uploadOptions?: { cacheControl?: string },
      ) {
        const failed = await step('storage.upload', gate);
        if (failed) return { data: null, error: failed.error };
        // avatars_insert_own: own folder, a profile, no active deletion marker.
        if (!path.startsWith(`${userId}/`) || !state.row || markerActive()) {
          return {
            data: null,
            error: {
              statusCode: '403',
              message: 'new row violates row-level security policy',
            },
          };
        }
        state.objects.set(path, { path, createdAt: now() });
        state.uploads.push({ path, cacheControl: uploadOptions?.cacheControl });
        return { data: { path }, error: null };
      },
      async list(
        folder: string,
        listOptions: { limit?: number; offset?: number } = {},
      ) {
        const failed = await step('storage.list', gate);
        if (failed) return { data: null, error: failed.error };
        const prefix = `${folder}/`;
        const entries = new Map<
          string,
          { id: string | null; created_at: string | null }
        >();
        for (const object of state.objects.values()) {
          if (!object.path.startsWith(prefix)) continue;
          const [head, ...tail] = object.path.slice(prefix.length).split('/');
          entries.set(
            head!,
            tail.length > 0
              ? { id: null, created_at: null }
              : {
                  id: object.path,
                  created_at: new Date(object.createdAt).toISOString(),
                },
          );
        }
        const sorted = [...entries.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, entry]) => ({ name, ...entry }));
        const offset = listOptions.offset ?? 0;
        return {
          data: sorted.slice(offset, offset + (listOptions.limit ?? 100)),
          error: null,
        };
      },
      async remove(paths: string[]) {
        const failed = await step('storage.remove', gate);
        if (failed) return { data: null, error: failed.error };
        const removed = paths.filter((path) => state.objects.delete(path));
        return { data: removed.map((name) => ({ name })), error: null };
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: `${PUBLIC_BASE}${path}` } };
      },
    };
  }

  function clientWith(gate?: Gate): SupabaseServerClient {
    const client = {
      from(table: string) {
        if (table !== 'profiles') throw new Error(`fake: no table ${table}`);
        return {
          select: (columns: string) => selectBuilder(columns, gate),
          update: (values: Partial<FakeRow>) => updateBuilder(values, gate),
        };
      },
      storage: { from: () => bucket(gate) },
      async rpc(name: string) {
        if (name !== 'delete_own_account') {
          throw new Error(`fake: no rpc ${name}`);
        }
        const failed = await step('rpc.delete_own_account', gate);
        if (failed?.lost) removeAccount();
        if (failed) return { data: null, error: failed.error };
        removeAccount();
        return { data: null, error: null };
      },
      auth: {
        async getClaims() {
          const failed = await step('auth.getClaims', gate);
          if (failed) return { data: null, error: failed.error };
          // No session reads as no claims and no error, as the SDK answers.
          return options.claims
            ? { data: { claims: options.claims }, error: null }
            : { data: null, error: null };
        },
        async getUser() {
          const failed = await step('auth.getUser', gate);
          if (failed) return { data: { user: null }, error: failed.error };
          if (!state.accountExists) {
            return {
              data: { user: null },
              error: {
                name: 'AuthApiError',
                code: 'user_not_found',
                status: 403,
              },
            };
          }
          return {
            data: { user: options.user ?? { id: userId } },
            error: null,
          };
        },
        async signOut() {
          await step('auth.signOut', gate);
          return { error: null };
        },
      },
    };
    return client as unknown as SupabaseServerClient;
  }

  return {
    clientWith,
    client: clientWith(),
    state,
    fail(label: OperationLabel, error: unknown, lost = false) {
      const queued = failures.get(label) ?? [];
      queued.push({ error, lost });
      failures.set(label, queued);
    },
    publicUrl: (path: string) => `${PUBLIC_BASE}${path}`,
  };
}

/** A promise a test resolves by hand, to hold an operation at a gate. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/**
 * A gate that holds the `n`th operation with `label` (counting from 1) until
 * `release` is called, and tells the test, through `reached`, that it is held.
 */
export function holdAt(label: OperationLabel, n = 1) {
  const reachedSignal = deferred();
  const releaseSignal = deferred();
  let seen = 0;
  const gate: Gate = async (current) => {
    if (current !== label) return;
    seen += 1;
    if (seen !== n) return;
    reachedSignal.resolve();
    await releaseSignal.promise;
  };
  return {
    gate,
    reached: reachedSignal.promise,
    release: releaseSignal.resolve,
  };
}
