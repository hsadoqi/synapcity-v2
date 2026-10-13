import { SynapcityLogo } from '../../components/logo-mark';
import { ModeToggle } from '../../components/mode-toggle';
import Link from 'next/link';

export const RootHeader = () => {
  return (
    <header className="flex w-full px-6 py-4">
        <div className="flex-1 flex items-center justify-between  gap-4">
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
      <ModeToggle variant="ghost"/>
    </div>
  );
};
