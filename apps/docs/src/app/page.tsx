import { Button } from '@synapcity/frontend-ui/core/button';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <div className="max-w-5xl flex-1 flex flex-col gap-4 items-center justify-center text-center">
        <h1>Welcome to Synapcity Docs</h1>
        <Button variant="ghost" size="lg">
          Get Started
        </Button>
      </div>
    </div>
  );
}
