export function LoadingRegion({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-busy="true" className="flex flex-col gap-10">
      <span className="sr-only" role="status">
        {label}
      </span>
      {children}
    </div>
  );
}
