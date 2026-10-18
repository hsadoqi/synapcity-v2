import { fixtureItems, fixturePinned } from '../../lib/fixtures';
import type { HomePageProps } from '../../lib/types';
import { HomePageView } from './home-page-view';

export function HomePageLayout({
  state = 'populated',
  items = fixtureItems,
  pinned = fixturePinned,
  dateLabel,
  dateTime,
}: HomePageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <HomePageView
        state={state}
        items={items}
        pinned={pinned}
        dateLabel={dateLabel}
        dateTime={dateTime}
      />
    </div>
  );
}
