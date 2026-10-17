export const RootFooter = () => {
  return (
    <footer className="flex w-full items-center justify-center border-t border-divider px-6 py-5 sm:px-10 lg:px-16">
      <p className="font-ui text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Synapcity. All rights reserved.
      </p>
    </footer>
  );
};
