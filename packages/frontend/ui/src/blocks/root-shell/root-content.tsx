import type { ReactNode } from 'react';

export const RootContent = ({ children }: { children: ReactNode }) => {
  return (
    // flex-1, not size-full: the footer shares this column, and 100% height
    // would push it below the fold on every page.
    <div className="relative flex w-full flex-1 justify-center">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 px-6 py-12 outline-none sm:px-12 lg:px-24"
      >
        {children}
      </main>
    </div>
  );
};
