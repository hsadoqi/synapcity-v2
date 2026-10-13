import { requireOwner } from '@/lib/auth/require-owner/require-owner';

export default async function HomePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireOwner((await params).userId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1>Home</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to the home page. You are signed in.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          This is a protected page that requires authentication. You can sign
          out using the button below.
        </p>
      </div>
    </div>
  );
}
