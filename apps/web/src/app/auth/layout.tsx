export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 items-start justify-center p-4 pt-16">
      <div className="flex w-full max-w-sm flex-col gap-6">{children}</div>
    </div>
  );
}
