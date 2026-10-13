export const RootContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex size-full justify-center relative">
      <main className="flex flex-1 px-6 py-12 sm:px-12 lg:px-24">
        {children}
      </main>
    </div>
  );
};
