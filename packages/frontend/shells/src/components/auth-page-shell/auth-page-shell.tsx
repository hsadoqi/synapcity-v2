// This page wrapper owns centring, width and the gutter around the card (the shell's
// content column has no padding of its own); the feature AuthShell owns the card and heading.
// It is presentation only. Which view a page shows, and whether it wants a guest
// or a session, is decided by the page in the app, never by this frame.
export const AuthPageShell = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:px-6 sm:py-12">
      <div className="flex w-full max-w-md flex-col gap-6">{children}</div>
    </div>
  );
};
