/*
 * Transitional compatibility entry. The brand components, their geometry and
 * their tests live in `@synapcity/frontend-brand/react`; this file only keeps
 * the old `@synapcity/frontend-ui/components/logo-mark` import working for
 * consumers that have not moved yet. New code imports the brand package.
 * Remove this file, its index, story and test, and the `components/index.ts`
 * line once no workspace consumer imports the old path.
 */
export * from '@synapcity/frontend-brand/react';
