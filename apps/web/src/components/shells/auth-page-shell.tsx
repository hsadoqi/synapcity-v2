// This page wrapper owns centring and width; the feature AuthShell owns the card and heading.
export const AuthPageShell = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">{children}</div>
    </div>
  );
};
