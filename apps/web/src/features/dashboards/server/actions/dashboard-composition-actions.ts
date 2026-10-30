'use server';

import { parsePersistableComposition } from '@synapcity/domain-dashboards';
import { recordIdSchema } from '@synapcity/domain-records';
import type { SaveOutcome } from '@synapcity/features-dashboards/contracts';
import { recordRecordView, saveComposition } from '@synapcity/server-data';
import type { Json } from '@synapcity/server-supabase';
import { z } from 'zod';

import { getCallerIdentity, SAVE_FAILED } from '@/lib/access/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { getVerifiedIdentity } from '@/features/auth/server/session';
import { logFailure } from '@/lib/log-failure';
import { createClient } from '@/lib/supabase/server';

// At least 1: the database creates the composition at revision 1 with the
// Dashboard, so there is no first save to base on revision 0.
const revisionSchema = z.number().int().min(1);

const failed = (message: string): SaveOutcome => ({
  ok: false,
  reason: 'failed',
  message,
});

/**
 * Saves a dashboard's composition for the caller (ADR-0016). Everything the
 * browser sends is checked here: the id, the base revision and the
 * composition itself (the contract, the link-widget allowlist, active
 * widgets only, the size cap). The caller is verified with a fresh lookup
 * (ADR-0006) and row-level security limits the write to their own dashboard.
 * The write is conditional on `baseRevision`, so a stale tab gets
 * `conflict` and nothing is overwritten; a write that changed no row is never
 * reported as saved.
 */
export async function saveDashboardComposition(
  dashboardId: unknown,
  composition: unknown,
  baseRevision: unknown,
): Promise<SaveOutcome> {
  if (fixtureModeEnabled()) return failed(FIXTURE_MESSAGE);
  const id = recordIdSchema.safeParse(dashboardId);
  const revision = revisionSchema.safeParse(baseRevision);
  const checked = parsePersistableComposition(composition);
  if (!id.success || !revision.success || !checked.ok) {
    logFailure(
      'saveDashboardComposition',
      { code: 'invalid_input' },
      {
        reason: checked.ok ? 'id_or_revision' : checked.reason,
      },
    );
    return failed(SAVE_FAILED);
  }

  const supabase = await createClient();
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) return failed(found.failure);

  const outcome = await saveComposition(
    supabase,
    id.data,
    checked.composition as unknown as NonNullable<Json>,
    revision.data,
  );
  if (outcome.ok) return { ok: true, revision: outcome.revision };
  if (outcome.reason === 'conflict') return { ok: false, reason: 'conflict' };
  logFailure('saveDashboardComposition', outcome.error);
  return failed(SAVE_FAILED);
}

/**
 * Notes that the caller opened one of their dashboards. The write skips a view
 * recorded under a minute ago, and a failure is logged, never reported to the
 * person. The caller is checked from the session claims, not with a fresh
 * provider lookup (the same ADR-0006 exception as `recordSpaceView`): the
 * write is a timestamp that row-level security limits to their own rows.
 */
export async function recordDashboardView(dashboardId: unknown): Promise<void> {
  if (fixtureModeEnabled()) return;
  const id = recordIdSchema.safeParse(dashboardId);
  if (!id.success) return;
  if ((await getVerifiedIdentity()).status !== 'verified') return;

  const outcome = await recordRecordView(
    await createClient(),
    'dashboards',
    id.data,
    new Date(),
  );
  if (!outcome.ok) logFailure('recordDashboardView', outcome.error);
}
