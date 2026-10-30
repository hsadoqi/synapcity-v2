/**
 * A stand-in origin for resolving a relative path with `URL`. A resolved URL
 * that still has it is same-origin; the `.invalid` top-level domain is reserved
 * and never resolves, so it can never be a real destination.
 */
export const PLACEHOLDER_ORIGIN = 'http://placeholder.invalid';
