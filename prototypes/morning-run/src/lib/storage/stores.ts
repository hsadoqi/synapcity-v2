import { z } from 'zod';

import { boardSchema, emptyBoard, layoutSchema } from '@/lib/board/model';
import { historySchema } from '@/lib/history/model';
import { runSchema } from '@/lib/runs/schema';
import { sessionSchema } from '@/lib/session/model';
import { createPersistedStore } from './persisted-store';

const PREFIX = 'morning-run';

export const sessionStore = createPersistedStore({
  key: `${PREFIX}:session`,
  schema: sessionSchema.nullable(),
  fallback: null,
});

export const historyStore = createPersistedStore({
  key: `${PREFIX}:history`,
  schema: historySchema,
  fallback: [],
});

export const customRunsStore = createPersistedStore({
  key: `${PREFIX}:custom-runs`,
  schema: z.array(runSchema).max(50),
  fallback: [],
});

export const prefsStore = createPersistedStore({
  key: `${PREFIX}:prefs`,
  schema: z.object({ pinned: z.array(z.string()).max(100) }),
  fallback: { pinned: [] as string[] },
});

export const boardStore = createPersistedStore({
  key: `${PREFIX}:board`,
  schema: boardSchema,
  fallback: emptyBoard(''),
});

export const layoutStore = createPersistedStore({
  key: `${PREFIX}:board-layout`,
  schema: layoutSchema,
  fallback: [],
});
