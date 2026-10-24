import { describe, expectTypeOf, it } from 'vitest';
import type { EntityItem } from '@synapcity/frontend-collection';

import type { DashboardItem, DocumentItem, Space } from './space-detail';

/*
 * The collection's entity blocks take any `EntityItem`; the Space detail shapes
 * are owned here. These pin that every Space shape still fits those blocks.
 * Type assertions: `check-types` is what fails when one stops holding.
 */
describe('the Space detail shapes', () => {
  it('fit the collection’s entity blocks', () => {
    expectTypeOf<Space>().toExtend<EntityItem>();
    expectTypeOf<DocumentItem>().toExtend<EntityItem>();
    expectTypeOf<DashboardItem>().toExtend<EntityItem>();
  });
});
