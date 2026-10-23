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
        className="flex flex-1 outline-none transition-[padding] duration-200 ease-out group-data-[global-panel=open]/work-area:py-4 sm:group-data-[global-panel=open]/work-area:py-6 lg:group-data-[global-panel=open]/work-area:py-8"
      >
        {children}
      </main>
    </div>
  );
};
