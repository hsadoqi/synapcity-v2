import type { ReactNode } from 'react';

export const RootContent = ({ children }: { children: ReactNode }) => {
  return (
    // flex-1, not size-full: the footer shares this column, and 100% height
    // would push it below the fold on every page. A page marked
    // data-fill-viewport (settings) may shrink to the space left, so it fills
    // the screen and scrolls inside itself instead of growing the column.
    <div className="relative flex w-full flex-1 justify-center has-data-fill-viewport:min-h-0">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 px-6 py-10 outline-none sm:px-10 sm:py-14 lg:px-16 lg:py-16"
      >
        {children}
      </main>
    </div>
  );
};
