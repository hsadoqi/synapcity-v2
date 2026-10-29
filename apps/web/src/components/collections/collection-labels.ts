/**
 * The words the trail uses for the two collections. "Space" is a provisional
 * label in docs/glossary.md, so the wording lives here once; renaming it is a
 * one-line change and touches no route, schema or type.
 */
export const COLLECTION_LABELS = {
  spaces: 'Spaces',
  documents: 'Documents',
  dashboards: 'Dashboards',
} as const;
