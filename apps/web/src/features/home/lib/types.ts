import type { CollectionItem } from '@/features/collection/shared';

type HomeState = 'populated' | 'loading' | 'empty';

export interface HomePageProps {
  state?: HomeState;
  items?: CollectionItem[];
  pinned?: CollectionItem[];
  dateLabel?: string;
  dateTime?: string;
}
