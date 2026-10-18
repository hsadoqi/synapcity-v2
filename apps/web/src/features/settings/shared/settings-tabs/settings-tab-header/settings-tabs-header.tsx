import { TabsList, TabsTrigger } from '@synapcity/frontend-ui/core/tabs';
import tabs from '../../../lib/data/tabs';

export const SettingsTabsHeader = ({
  onTabChange,
}: {
  onTabChange: (value: string) => void;
}) => {
  return (
    <div className="settings-tab-bar overflow-hidden border-b border-border">
      <TabsList
        variant="line"
        className="w-full"
        aria-label="Settings categories"
      >
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            aria-label={label}
            onClick={() => onTabChange(value)}
          >
            <Icon />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};
