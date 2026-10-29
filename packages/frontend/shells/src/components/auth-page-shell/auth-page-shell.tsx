// This page wrapper owns centring, width and the gutter around the card (the shell's
// content column has no padding of its own); the feature AuthShell owns the card and heading.
// TODO: Extend this to be an actual auth page shell and handle auth views properly (conditionally)
export const AuthPageShell = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:px-6 sm:py-12">
      <div className="flex w-full max-w-md flex-col gap-6">{children}</div>
    </div>
  );
};
