import type { HomePageProps } from '../../lib/types';
import { EmptyPageContent } from './empty-page-content';
import {
  EmptyRecentLine,
  EmptyRecentLineSkeleton,
} from './empty-page-recent-line';

export function EmptyPageLayout({
  state,
  items = [],
  onCreate = () => {},
  singular = 'space',
}: Pick<HomePageProps, 'state' | 'items'> & {
  onCreate: () => void;
  singular: string;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-prose flex-col justify-center gap-8 px-4 pt-12 pb-24 sm:px-6">
      <EmptyPageContent onCreate={onCreate} singular={singular} />
      {state === 'loading' ? (
        <EmptyRecentLineSkeleton />
      ) : (
        <EmptyRecentLine items={state === 'empty' ? [] : items} />
      )}
    </div>
  );
}
