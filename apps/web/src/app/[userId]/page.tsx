import { requireOwner } from '@/lib/access/require-owner';

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireOwner((await params).userId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome to Synapcity Home!
      </h1>
      <p className="max-w-175 text-lg text-muted-foreground">
        This is a starter template for building a web application using Next.js,
        TypeScript, Tailwind CSS, and Supabase. It includes a basic
        authentication flow with sign up, sign in, and password reset
        functionality.
      </p>
    </div>
  );
}
