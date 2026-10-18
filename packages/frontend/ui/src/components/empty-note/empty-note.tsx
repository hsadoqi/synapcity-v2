export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-pretty text-muted-foreground">
      {children}
    </p>
  );
}
