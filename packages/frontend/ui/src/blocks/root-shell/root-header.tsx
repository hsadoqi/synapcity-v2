import { SynapcityLogo } from '../../components/logo-mark';
import { ModeToggle } from '../../components/mode-toggle';
import Link from 'next/link';

export const RootHeader = () => {
  return (
    <header className="flex w-full ">
      <div className="flex-1 flex items-center justify-between gap-4 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
        <RootLogoLink />
        <RootIconActions />
      </div>
    </header>
  );
};

const RootLogoLink = () => {
  return (
    <Link href="/">
      <SynapcityLogo size="sm" className="text-foreground" />
    </Link>
  );
};

const RootIconActions = () => {
  return (
    <div className="flex items-center gap-4">
      <ModeToggle variant="ghost" />
    </div>
  );
};
