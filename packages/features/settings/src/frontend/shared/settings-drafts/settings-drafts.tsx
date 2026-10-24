'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type DraftEntry = {
  hasChanges: boolean;
  save: () => void;
  discard: () => void;
};

type Registry = {
  register: (section: string, read: () => DraftEntry) => () => void;
  /** The tabs holding unsaved changes, read at the moment of asking. */
  unsaved: () => { section: string; save: () => void; discard: () => void }[];
};

const SettingsDrafts = createContext<Registry | null>(null);

/**
 * Where each settings tab's draft makes itself known, so leaving the page can
 * ask about every unsaved tab at once rather than only the one in view.
 */
export function SettingsDraftsProvider({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, () => DraftEntry>());
  const [registry] = useState<Registry>(() => ({
    register(section, read) {
      entries.current.set(section, read);
      return () => {
        if (entries.current.get(section) === read)
          entries.current.delete(section);
      };
    },
    unsaved: () =>
      [...entries.current].flatMap(([section, read]) => {
        const entry = read();
        return entry.hasChanges
          ? [{ section, save: entry.save, discard: entry.discard }]
          : [];
      }),
  }));
  return (
    <SettingsDrafts.Provider value={registry}>
      {children}
    </SettingsDrafts.Provider>
  );
}

/** Null outside the provider, where a tab rendered on its own has no guard. */
export const useSettingsDrafts = () => useContext(SettingsDrafts);

/** Keeps the registry pointed at this tab's latest draft. */
export function useRegisterSettingsDraft(section: string, entry: DraftEntry) {
  const registry = useContext(SettingsDrafts);
  const latest = useRef(entry);
  useEffect(() => {
    latest.current = entry;
  });
  useEffect(
    () => registry?.register(section, () => latest.current),
    [registry, section],
  );
}
