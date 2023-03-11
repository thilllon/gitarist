/* eslint-disable @typescript-eslint/no-empty-interface */
import { ListRepositoriesOptions } from './gitarist.interface';

export interface RunListRepositoriesArgs
  extends Omit<ListRepositoriesOptions, 'owner'> {
  owner?: string;
}
