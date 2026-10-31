import type { CollectionItem } from '@synapcity/frontend-collection';

type HomeState = 'populated' | 'loading' | 'empty';

export interface HomePageProps {
  state?: HomeState;
  items?: CollectionItem[];
  pinned?: CollectionItem[];
  dateLabel?: string;
  dateTime?: string;
  /** The signed-in owner, for links to their routes. */
  userId?: string;
  /**
   * The items are sample content, not the person's own work: Home says so
   * above them until it reads real history.
   */
  sample?: boolean;
}
