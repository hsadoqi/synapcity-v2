import type { FieldRenderer } from '../../types';

/** Thrown when a field's type has no renderer. Names the type, never a value. */
export class UnknownFieldTypeError extends Error {
  readonly type: string;

  constructor(type: string) {
    super(`No renderer is registered for the field type "${type}"`);
    this.name = 'UnknownFieldTypeError';
    this.type = type;
  }
}

/**
 * Maps a field type to the component that renders it. A registry is scoped:
 * `clone` gives a provider its own copy, so one form's additions never reach
 * another's. There is no fallback renderer; an unknown type fails loudly.
 */
export class FieldRendererRegistry {
  readonly #renderers = new Map<string, FieldRenderer>();

  register(type: string, renderer: FieldRenderer): this {
    this.#renderers.set(type, renderer);
    return this;
  }

  has(type: string): boolean {
    return this.#renderers.has(type);
  }

  resolve(type: string): FieldRenderer {
    const renderer = this.#renderers.get(type);
    if (renderer === undefined) throw new UnknownFieldTypeError(type);
    return renderer;
  }

  clone(): FieldRendererRegistry {
    const copy = new FieldRendererRegistry();
    for (const [type, renderer] of this.#renderers)
      copy.register(type, renderer);
    return copy;
  }
}
