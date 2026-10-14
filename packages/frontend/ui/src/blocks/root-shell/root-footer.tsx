export const RootFooter = () => {
  return (
    <footer className="flex w-full items-center justify-center border-t border-divider px-6 py-6 sm:px-12 lg:px-24">
      <p className="font-ui text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Synapcity. All rights reserved.
      </p>
    </footer>
  );
};
