import { starter } from './starter';
import { twoUserIsolation } from './two-user-isolation';
import type { Scenario } from './scenario';

export type { Membership, Scenario, ScenarioUser } from './scenario';
// Presentation data, deliberately outside the registry below (see the file).
export { DEMO_WORKBENCH, demoWorkbench } from './demo-workbench';
export { demoCompositions, scenarioToSql } from './demo-sql';

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
export {
  demoContent,
  demoResourceId,
  demoWorkspaceId,
  demoWorkspaces,
  type DemoContent,
  type DemoResource,
  type DemoWorkspace,
} from './demo-workbench-model';
