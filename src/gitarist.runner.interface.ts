/* eslint-disable @typescript-eslint/no-empty-interface */
import { DotenvConfigOptions } from 'dotenv';
import { ListRepositoriesOptions } from './gitarist.interface';

export interface GitaristRunnerConfig {
  dotenv?: DotenvConfigOptions;
}
export interface RunListRepositoriesArgs
  extends Omit<ListRepositoriesOptions, 'owner'> {
  owner?: string;
}

export interface RunDeleteRepositoryListOptions {
  targetPath?: string;
}

export interface RunListBranchesOptions {
  owner?: string;
  repo?: string;
  ref: string;
}
