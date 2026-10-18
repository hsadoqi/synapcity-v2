export const HomePageShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-dvh flex-col flex-1">
      <main className="min-h-0 flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};
