import { SynapcityLogo } from '../../components/logo-mark';
import { ModeToggle } from '../../components/mode-toggle';
import Link from 'next/link';

export const RootHeader = () => {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4">
      <RootLogoLink />
      <RootIconActions />
    </header>
  );
};

const RootLogoLink = () => {
  return (
    <Link href="/">
      <SynapcityLogo size="md" className="text-foreground" />
    </Link>
  );
};

const RootIconActions = () => {
  return (
    <div className="flex items-center gap-4">
      <ModeToggle />
    </div>
  );
};
