import { AuthStatus } from '@/components/auth/display/auth-status';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <div className="max-w-5xl flex-1 flex flex-col gap-4 items-center justify-center text-center">
        <h1>Welcome to Synapcity Web</h1>
        <AuthStatus variant="hero" />
      </div>
    </div>
  );
}
