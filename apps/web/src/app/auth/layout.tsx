export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:px-6 sm:py-14">
      <div className="flex w-full max-w-md flex-col gap-6">{children}</div>
    </div>
  );
}
