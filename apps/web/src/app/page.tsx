import { Button } from '@synapcity/frontend-ui/core/button';

export default function Home() {
  return (
    <div className="flex min-h-svh w-full justify-center px-6 py-12 sm:px-12 lg:px-24">
      <main className="flex flex-col gap-4 w-full max-w-5xl flex-1 items-center justify-center text-center">
        <h1>Welcome to Synapcity Web</h1>
        <Button variant="ghost" size="lg">
          Get Started
        </Button>
      </main>
    </div>
  );
}
