import type { SpaceEntity } from '../../shared/types';
import { listSpaces } from '../space-repository';

export async function getSpaces(): Promise<SpaceEntity[]> {
  return listSpaces();
}
