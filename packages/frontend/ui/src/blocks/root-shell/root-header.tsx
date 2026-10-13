import { ModeToggle } from '../../components/mode-toggle';

export const RootHeader = () => {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4 drop-shadow-2xl">
      <h1 className="text-2xl font-bold">Synapcity</h1>
      <ModeToggle />
    </header>
  );
};
