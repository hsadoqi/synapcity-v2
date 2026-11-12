import { Scenario } from './scenario';
import { starter } from './starter';
import { twoUserIsolation } from './two-user-isolation/two-user-isolation';

const builders = {
  starter,
  'two-user-isolation': twoUserIsolation,
} satisfies Record<string, () => Scenario>;

export type ScenarioName = keyof typeof builders;
export const scenarioNames = Object.keys(builders) as ScenarioName[];

/** A fresh copy of a named scenario; building twice gives equal, independent graphs. */
export function buildScenario(name: ScenarioName): Scenario {
  return builders[name]();
}
