import {
  accountPart,
  acceptsCache,
  displayOf,
  mergeSettings,
  ownerForWrite,
  pageLanguage,
  parseImport,
  reconcile,
  resolveSession,
  settingsDefaults,
  touchesAccount,
  withoutStoredAccount,
  type AccountPreferences,
  type CacheOwner,
  type DisplaySettings,
  type Look,
  type PreferencesSession,
  type SavePreferencesResult,
  type Settings,
  type SettingsPatch,
} from '@synapcity/domain-preferences';
import type { Mode } from '../../types';
import {
  applyAppearance,
  applyFontPreferences,
  applyThemeShape,
  PREFERENCES_STORAGE_KEY,
} from '../../scripts';
import {
  clearStoredPreferences,
  deviceTimezone,
  migrateLookToCookie,
  PREFERENCES_OWNER_KEY,
  readCacheOwner,
  readDeviceDisplay,
  readLookCookie,
  readStoredPreferences,
  saveLook,
  writeCacheOwner,
  writeDeviceDisplay,
  writeStoredPreferences,
} from '../../store';

/** Saves the account part; the host binds it to its own server action. */
export type SaveAccountPreferences = (
  preferences: AccountPreferences,
  deviceTimezone: string,
) => Promise<SavePreferencesResult>;

/**
 * What the runtime last has to say. The presentation layer words it; the
 * runtime only reports what happened.
 */
export type PreferencesStatus =
  | { kind: 'idle' }
  | { kind: 'saved' }
  | { kind: 'not-ready' }
  | { kind: 'invalid-update' }
  | { kind: 'storage-unavailable'; during: 'load' | 'write' }
  | { kind: 'stored-unreadable' }
  | { kind: 'account-save-pending' }
  | { kind: 'account-save-failed'; message: string | null; signedOut: boolean };

export type PreferencesSnapshot = {
  /**
   * `server` while rendering on the server and hydrating: only what the server
   * knew. `ready` once this browser's saved copy has been applied.
   */
  phase: 'server' | 'ready';
  settings: Settings;
  /** The zone `system` stands for: the account's last device zone on the server, then this browser's. */
  timeZone: string | null;
  /** `synced`: account changes are saved; `unavailable`: the account could not be read. */
  sync: 'none' | 'synced' | 'unavailable';
  displayOnAllDevices: boolean;
  accountSave: 'idle' | 'saving' | 'failed';
  /**
   * The unresolved account-save failure, kept apart from `status` so a later
   * device-only report cannot erase it: `retryable` may be tried again;
   * `signed-out` may not, because the session that would save has ended.
   */
  accountFailure: 'none' | 'retryable' | 'signed-out';
  /** The server's wording for a `signed-out` failure, if it gave one. */
  accountFailureMessage: string | null;
  status: PreferencesStatus;
  /** Grows with every status report, so the same status twice is still news. */
  statusId: number;
};

export type PreferencesStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PreferencesSnapshot;
  getServerSnapshot: () => PreferencesSnapshot;
  /** Browser only: loads the saved copy and starts listening. Returns the stop. */
  start: () => () => void;
  /** Replaces the request-bound session and its saver as one transition. */
  setHost: (
    session: PreferencesSession,
    save: SaveAccountPreferences | undefined,
  ) => void;
  /** The mode next-themes holds, and how to change it; it owns mode. */
  bindMode: (mode: string | undefined, setMode: (mode: Mode) => void) => void;
  /** Applies and saves a change. False when it was refused (see `status`). */
  update: (patch: SettingsPatch) => boolean;
  setDisplayOnAllDevices: (on: boolean) => void;
  retryAccountSave: () => void;
};

const modes: readonly string[] = ['light', 'dark', 'system'];

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Keeps each unchanged section's identity, so a subscriber to one category
 * does not re-render when another changes.
 */
function shareSections(previous: Settings, next: Settings): Settings {
  let changed = false;
  const shared = { ...next };
  for (const section of Object.keys(next) as (keyof Settings)[]) {
    if (sameJson(previous[section], next[section])) {
      (shared as Record<string, unknown>)[section] = previous[section];
    } else {
      changed = true;
    }
  }
  return changed ? shared : previous;
}

function withMode(settings: Settings, mode: Mode): Settings {
  if (settings.theme.mode === mode && settings.appearance.colorScheme === mode)
    return settings;
  return {
    ...settings,
    theme: { ...settings.theme, mode },
    appearance: { ...settings.appearance, colorScheme: mode },
  };
}

/** The settings the server can know: the request's look, then the account. */
export function serverSettings(
  session: PreferencesSession,
  look: Look | null,
): Settings {
  const base = look
    ? mergeSettings(settingsDefaults, {
        theme: look.theme,
        appearance: { ...look.appearance, colorScheme: look.theme.mode },
      })
    : settingsDefaults;
  if (session.kind !== 'account' || !session.stored?.preferences) return base;
  return reconcile(base, session.stored.preferences, null).settings;
}

function serverSync(session: PreferencesSession): PreferencesSnapshot['sync'] {
  if (session.kind === 'guest') return 'none';
  return session.stored ? 'synced' : 'unavailable';
}

/** Puts these settings on <html>, touching only what changed since `before`. */
function applyToDocument(before: Settings | null, after: Settings) {
  const root = document.documentElement;
  const a = after.appearance;
  const b = before?.appearance;
  if (
    !b ||
    b.animationsEnabled !== a.animationsEnabled ||
    b.showBorders !== a.showBorders ||
    b.reducedMotion !== a.reducedMotion ||
    b.contrastMode !== a.contrastMode
  ) {
    applyAppearance(root, a);
  }
  const t = after.theme;
  const bt = before?.theme;
  if (
    !bt ||
    bt.headingFont !== t.headingFont ||
    bt.bodyFont !== t.bodyFont ||
    bt.codeFont !== t.codeFont
  ) {
    applyFontPreferences(root, t);
  }
  if (
    !bt ||
    bt.radius !== t.radius ||
    bt.density !== t.density ||
    bt.textSize !== t.textSize
  ) {
    applyThemeShape(root, t);
  }
  root.lang = pageLanguage(after.regional.language);
}

type Local = {
  settings: Settings | null;
  owner: CacheOwner | null;
  setAside: DisplaySettings | null;
  problem: PreferencesStatus | null;
  hasDocument: boolean;
};

/** Reads everything this browser holds. Never throws; a problem is reported. */
function readLocal(fallback: Settings | null = null): Local {
  let settings: Settings | null = fallback;
  let owner: CacheOwner | null = null;
  let problem: PreferencesStatus | null = null;
  let hasDocument = false;
  try {
    let saved = readStoredPreferences();
    hasDocument = saved !== null;
    if (saved) {
      // Earlier versions stored an account entry (with a typed password)
      // beside the preferences; it must not stay in the browser.
      const cleaned = withoutStoredAccount(saved);
      if (cleaned !== undefined) {
        try {
          if (cleaned === null) clearStoredPreferences();
          else writeStoredPreferences(cleaned);
        } catch {
          // Ignored either way: the entry is never read as a preference.
        }
        saved = cleaned;
      }
    }
    if (saved) {
      try {
        settings = parseImport(JSON.parse(saved)).settings;
      } catch {
        problem = { kind: 'stored-unreadable' };
      }
    }
    owner = readCacheOwner();
  } catch {
    problem = { kind: 'storage-unavailable', during: 'load' };
  }
  return {
    settings,
    owner,
    setAside: readDeviceDisplay(),
    problem,
    hasDocument,
  };
}

/**
 * The one runtime owner of a person's preferences in the browser (ADR-0010).
 * It resolves the session against the cached copy, applies the result to the
 * document, keeps the cache, cookie and account in step, and tells every
 * subscriber. Account saves are serialized: one in flight, the newest waiting,
 * so an older write can never land after a newer one.
 */
export function createPreferencesStore(initial: {
  session: PreferencesSession;
  look?: Look | null;
  save?: SaveAccountPreferences;
}): PreferencesStore {
  let session = initial.session;
  let saver = initial.save;
  /**
   * The device's visual fields when the browser document is missing,
   * unreadable or blocked: the shared look cookie as it is now (it may have
   * been rewritten since this request, by sign-out for example), else the
   * request's own. It carries display choices only, so it is never a document
   * anyone could adopt.
   */
  const lookFallback = (): Settings | null => {
    const look = readLookCookie() ?? initial.look ?? null;
    return look ? serverSettings({ kind: 'guest' }, look) : null;
  };
  const listeners = new Set<() => void>();

  const serverSnapshot: PreferencesSnapshot = {
    phase: 'server',
    settings: serverSettings(session, initial.look ?? null),
    timeZone:
      session.kind === 'account'
        ? (session.stored?.deviceTimezone ?? null)
        : null,
    sync: serverSync(session),
    displayOnAllDevices: Boolean(
      session.kind === 'account' &&
      session.stored?.preferences?.appearanceOverride,
    ),
    accountSave: 'idle',
    accountFailure: 'none',
    accountFailureMessage: null,
    status: { kind: 'idle' },
    statusId: 0,
  };
  let snapshot = serverSnapshot;

  // Browser state behind the snapshot.
  let owner: CacheOwner | null = null;
  let hasDocument = false;
  let setAside: DisplaySettings | null = null;
  let override: DisplaySettings | null = null;
  let mode: Mode | null = null;
  let setMode: ((mode: Mode) => void) | null = null;
  let started = false;
  let applied = false;

  // Account saves.
  let generation = 0;
  let inFlight = false;
  let queued = false;
  let activeFlush: Promise<void> | null = null;

  function emit(next: Partial<PreferencesSnapshot>) {
    const settings = next.settings
      ? shareSections(snapshot.settings, withModeIfKnown(next.settings))
      : snapshot.settings;
    snapshot = {
      ...snapshot,
      ...next,
      settings,
      ...(next.status && { statusId: snapshot.statusId + 1 }),
    };
    for (const listener of listeners) listener();
  }

  function withModeIfKnown(settings: Settings) {
    return mode ? withMode(settings, mode) : settings;
  }

  /**
   * Whether a local write's report may be shown. "Saved" is withheld while
   * an account write is pending, failed, or about to start for this very
   * change: the account outcome decides what is true then.
   */
  function shouldReportLocal(
    status: PreferencesStatus,
    sendsToAccount: boolean,
  ) {
    return (
      status.kind !== 'saved' ||
      (!sendsToAccount &&
        snapshot.accountSave === 'idle' &&
        snapshot.accountFailure === 'none')
    );
  }

  /** Commits settings: state, document, then the browser's copies. */
  function commit(
    next: Settings,
    extra: Partial<PreferencesSnapshot> = {},
    persistLocally = true,
  ): PreferencesStatus {
    // The first commit applies everything: the server rendered the request's
    // look, not necessarily what this browser has saved.
    const before = applied ? snapshot.settings : null;
    emit({ ...extra, settings: next });
    applyToDocument(before, snapshot.settings);
    applied = true;
    if (!persistLocally) return { kind: 'idle' };
    return writeLocal(snapshot.settings);
  }

  function writeLocal(settings: Settings): PreferencesStatus {
    // The cookie is its own channel: blocked storage must not stop the look
    // reaching other hosts, and a blocked cookie is not reported as storage.
    saveLook(settings);
    writeDeviceDisplay(setAside);
    try {
      const nextOwner = ownerForWrite(session, owner, hasDocument);
      writeStoredPreferences(JSON.stringify(settings));
      writeCacheOwner(nextOwner);
      owner = nextOwner;
      hasDocument = true;
      return { kind: 'saved' };
    } catch {
      return { kind: 'storage-unavailable', during: 'write' };
    }
  }

  /** Whether an account change made now would be sent. */
  function savesToAccount() {
    return (
      saver !== undefined &&
      snapshot.sync === 'synced' &&
      snapshot.accountFailure !== 'signed-out'
    );
  }

  function requestSave() {
    if (!savesToAccount()) return;
    queued = true;
    if (!inFlight) runFlush();
    else if (snapshot.accountSave !== 'saving') {
      emit({
        accountSave: 'saving',
        status: { kind: 'account-save-pending' },
      });
    }
  }

  function runFlush() {
    const task = flush();
    activeFlush = task;
    void task.finally(() => {
      if (activeFlush === task) activeFlush = null;
    });
  }

  async function flush() {
    const save = saver;
    if (!save) return;
    const run = generation;
    queued = false;
    inFlight = true;
    // Taken now, so the newest state is what is sent.
    const document = accountPart(snapshot.settings, override);
    if (snapshot.accountSave !== 'saving') {
      emit({
        accountSave: 'saving',
        status: { kind: 'account-save-pending' },
      });
    }
    let result: SavePreferencesResult;
    try {
      result = await save(document, deviceTimezone());
    } catch {
      result = { ok: false, error: '' };
    }
    // A different person is signed in now: this outcome is not theirs.
    if (run !== generation) return;
    inFlight = false;
    if (queued) {
      // A newer change supersedes this outcome.
      runFlush();
      return;
    }
    if (result.ok) {
      emit({
        accountSave: 'idle',
        accountFailure: 'none',
        accountFailureMessage: null,
        status: { kind: 'saved' },
      });
    } else {
      emit({
        accountSave: 'failed',
        accountFailure: result.signedOut ? 'signed-out' : 'retryable',
        accountFailureMessage: result.signedOut ? result.error : null,
        status: {
          kind: 'account-save-failed',
          message: result.signedOut ? result.error : null,
          signedOut: Boolean(result.signedOut),
        },
      });
    }
  }

  /** Loads from storage and applies the current session. */
  function load(local: Local, report = true) {
    owner = local.owner;
    hasDocument = local.hasDocument;
    const resolution = resolveSession(session, local, deviceTimezone());
    setAside = resolution.setAside;
    override = resolution.override;
    const extra: Partial<PreferencesSnapshot> = {
      phase: 'ready',
      timeZone: deviceTimezone(),
      sync: resolution.sync,
      displayOnAllDevices: override !== null,
      ...(report && local.problem && { status: local.problem }),
    };
    if (resolution.rewrite) {
      owner = resolution.owner;
      commit(resolution.settings, extra);
    } else {
      commit(resolution.settings, extra, false);
    }
    if (resolution.save) requestSave();
  }

  function onStorage(event: StorageEvent) {
    if (
      event.key !== null &&
      event.key !== PREFERENCES_STORAGE_KEY &&
      event.key !== PREFERENCES_OWNER_KEY
    )
      return;
    const local = readLocal();
    // Another tab signed in as someone else: never take their copy.
    if (!local.settings || !acceptsCache(session, local.owner)) return;
    owner = local.owner;
    hasDocument = true;
    setAside = local.setAside;
    const nextSettings =
      session.kind === 'guest'
        ? resolveSession(session, local, deviceTimezone()).settings
        : local.settings;
    override =
      session.kind === 'account' && local.setAside
        ? displayOf(nextSettings)
        : null;
    commit(nextSettings, { displayOnAllDevices: override !== null }, false);
  }

  function onOnline() {
    if (snapshot.accountFailure === 'retryable') requestSave();
  }

  const store: PreferencesStore = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,

    start() {
      if (!started) {
        started = true;
        // A look saved before the shared cookie existed is carried over once.
        migrateLookToCookie();
        load(readLocal(lookFallback()));
      }
      window.addEventListener('storage', onStorage);
      window.addEventListener('online', onOnline);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('online', onOnline);
      };
    },

    setHost(next, save) {
      // The saver belongs to the same request-bound host state as the
      // session. Install it first so sign-in adoption cannot be dropped.
      const previousSaver = saver;
      saver = save;
      if (sameJson(next, session)) return;
      const samePerson =
        next.kind === session.kind &&
        (next.kind === 'guest' ||
          (session.kind === 'account' && next.userId === session.userId));
      if (!started) {
        session = next;
        return;
      }
      if (!samePerson) {
        // If a newer account change is waiting behind the active request,
        // drain its captured payload in order. It is detached from the next
        // session: the server action identifies the caller and may reject a
        // completed sign-out, while this runtime ignores either outcome.
        if (
          session.kind === 'account' &&
          queued &&
          previousSaver &&
          activeFlush
        ) {
          const pendingSave = previousSaver;
          const pendingDocument = accountPart(snapshot.settings, override);
          const pendingZone = deviceTimezone();
          void activeFlush
            .then(() => pendingSave(pendingDocument, pendingZone))
            .catch(() => undefined);
        }
        // Sign-in, sign-out or another account: drop the last person's saves
        // from this runtime and resolve again from what the browser holds.
        generation++;
        inFlight = false;
        queued = false;
        session = next;
        emit({
          accountSave: 'idle',
          accountFailure: 'none',
          accountFailureMessage: null,
          status: { kind: 'idle' },
        });
        load(readLocal(lookFallback()), false);
        return;
      }
      session = next;
      // A refreshed row for the same person. While a save is pending this
      // browser holds the newer value, and the save will supersede the row.
      if (inFlight || queued) return;
      load(
        {
          settings: snapshot.settings,
          owner,
          setAside,
          problem: null,
          hasDocument,
        },
        false,
      );
    },

    bindMode(current, change) {
      setMode = change;
      if (!current || !modes.includes(current) || current === mode) return;
      mode = current as Mode;
      emit({ settings: snapshot.settings });
    },

    update(patch) {
      if (snapshot.phase !== 'ready') {
        emit({ status: { kind: 'not-ready' } });
        return false;
      }
      let next: Settings;
      try {
        next = mergeSettings(snapshot.settings, patch);
      } catch {
        emit({ status: { kind: 'invalid-update' } });
        return false;
      }
      if (next.theme.mode !== snapshot.settings.theme.mode) {
        mode = next.theme.mode;
        setMode?.(next.theme.mode);
      }
      // While display settings apply everywhere, a display change is an
      // account change too.
      const displayChanged = Boolean(override && patch.appearance);
      if (displayChanged) override = displayOf(next);
      const accountChange = displayChanged || touchesAccount(patch);
      const sends = accountChange && savesToAccount();
      const status = commit(next);
      emit({
        ...(shouldReportLocal(status, sends) && { status }),
        displayOnAllDevices: override !== null,
      });
      if (accountChange) requestSave();
      return true;
    },

    setDisplayOnAllDevices(on) {
      if (snapshot.phase !== 'ready' || snapshot.sync !== 'synced') return;
      const now = snapshot.settings;
      let next = now;
      if (on) {
        // Kept, to restore when this is turned off.
        setAside = displayOf(now);
        override = displayOf(now);
      } else {
        override = null;
        if (setAside) next = mergeSettings(now, { appearance: setAside });
        setAside = null;
      }
      const status = commit(next, { displayOnAllDevices: on });
      if (shouldReportLocal(status, savesToAccount())) emit({ status });
      requestSave();
    },

    retryAccountSave() {
      if (snapshot.accountFailure === 'retryable') requestSave();
    },
  };
  return store;
}
