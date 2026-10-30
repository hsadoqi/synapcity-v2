'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

import { createDefaultRegistry } from '../default-registry/create-default-registry';
import type { FieldRendererRegistry } from '../field-renderer-registry/field-renderer-registry';

const FieldRendererContext = createContext<FieldRendererRegistry | null>(null);

export interface FieldRendererProviderProps {
  readonly children: ReactNode;
  /** The renderers to start from (the built-in ones by default). The provider works on a copy. */
  readonly registry?: FieldRendererRegistry;
  /** Adds renderers for this provider only, such as a feature's `custom:*` types. */
  readonly extend?: (registry: FieldRendererRegistry) => void;
}

/**
 * Supplies the field renderers to every form below it. The registry is copied
 * once when the provider mounts, so neither `extend` nor a later change to the
 * registry passed in reaches another provider.
 */
export function FieldRendererProvider({
  children,
  registry,
  extend,
}: FieldRendererProviderProps) {
  const [scoped] = useState(() => {
    const copy = (registry ?? createDefaultRegistry()).clone();
    extend?.(copy);
    return copy;
  });
  return (
    <FieldRendererContext.Provider value={scoped}>
      {children}
    </FieldRendererContext.Provider>
  );
}

export function useFieldRendererRegistry(): FieldRendererRegistry {
  const registry = useContext(FieldRendererContext);
  if (registry === null) {
    throw new Error(
      'useFieldRendererRegistry must be used inside a FieldRendererProvider',
    );
  }
  return registry;
}

/** The registry from the nearest provider, or `null` when there is none. */
export function useOptionalFieldRendererRegistry(): FieldRendererRegistry | null {
  return useContext(FieldRendererContext);
}
