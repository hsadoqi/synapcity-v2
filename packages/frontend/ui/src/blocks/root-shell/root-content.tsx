export const RootContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex size-full justify-center relative">
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
