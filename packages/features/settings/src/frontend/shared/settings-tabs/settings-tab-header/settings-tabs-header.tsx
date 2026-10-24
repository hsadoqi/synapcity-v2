import { TabsList, TabsTrigger } from '@synapcity/frontend-ui/core/tabs';
import { settingsTabItems } from '../../../lib/data/tab-items';

export const SettingsTabsHeader = ({
  onTabChange,
}: {
  onTabChange: (value: string) => void;
}) => {
  return (
    // Not overflow-hidden: the active tab's line sits just below the list, on
    // this rule, and clipping cut it to a sliver.
    // Sticky, so the tabs stay in reach where the whole page shell scrolls
    // (small screens). z-10 lifts it over the accordion triggers, which are
    // positioned and come later in the page. In the sidebar (roomy) it is a
    // plain list with a rule at its end, which the active tab's line sits on:
    // the line is drawn just past the list, so pe-1 brings it to the rule.
    <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background roomy:static roomy:border-e roomy:border-b-0 roomy:bg-transparent roomy:pe-1">
      <TabsList
        variant="line"
        className="w-full"
        aria-label="Settings categories"
      >
        {settingsTabItems.map(({ value, label, icon: Icon }) => (
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
