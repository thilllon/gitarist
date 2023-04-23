// import chalk from 'chalk';
import dotenv from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { Gitarist } from './gitarist';
import {
  GitaristRunnerConfig,
  RunDeleteRepositoryListOptions,
  RunListBranchesOptions,
  RunListRepositoriesArgs,
} from './gitarist-runner.interface';
import { Templates } from './gitarist-template';

export class GitaristRunner extends Gitarist {
  constructor({ dotenv: dotenvConfig = {} }: GitaristRunnerConfig = {}) {
    dotenv.config(dotenvConfig);

    const owner = process.env.GITARIST_OWNER;
    const repo = process.env.GITARIST_REPO;
    const authToken = process.env.GITARIST_TOKEN;

    super({ owner, repo, authToken });
  }

  runInitialize({ dir = '' }: { dir?: string }) {
    const workflowDir = path.join(process.cwd(), dir, '.github', 'workflows');
    mkdirSync(workflowDir, { recursive: true });

    writeFileSync(
      path.join(workflowDir, 'gitarist.yml'),
      Templates.getActionTemplate(),
      { encoding: 'utf8', flag: 'w+' }
    );

    writeFileSync(
      path.join(process.cwd(), dir, '.env'),
      Templates.getEnvTemplate(),
      { encoding: 'utf8', flag: 'a+' }
    );

    console.log(`\nGenerate a secret key settings:`);
    // console.log(
    //   chalk.greenBright.bold(
    //     `https://github.com/settings/tokens/new?description=GITARIST_TOKEN&scopes=repo,read:packages,read:org,delete_repo,workflow`
    //   )
    // );
    console.log(
      `https://github.com/settings/tokens/new?description=GITARIST_TOKEN&scopes=repo,read:packages,read:org,delete_repo,workflow`
    );

    console.log(`\nRegister the secret key to action settings:`);
    // console.log(
    //   chalk.greenBright.bold(
    //     `https://github.com/<USERNAME>/${dir}/settings/new`
    //   )
    // );
    console.log(`https://github.com/<USERNAME>/${dir}/settings/new`);
  }

  /**
   * Imitate an active user
   */
  async runImitateActiveUser({
    maxCommits,
    minCommits,
    maxFiles,
    minFiles,
  }: {
    maxCommits?: number;
    minCommits?: number;
    maxFiles?: number;
    minFiles?: number;
  }) {
    const owner = this.owner;
    const repo = this.repo;

    await this.mimicIssueReport({ owner, repo });

    await this.mimicPullRequest({
      owner,
      repo,
      reviewOptions: {
        content: 'LGTM',
      },
    });

    await this.createCommits({
      owner,
      repo,
      branch: 'main',
      numFiles: { min: minFiles ?? 1, max: maxFiles ?? 10 },
      numCommits: { min: minCommits ?? 1, max: maxCommits ?? 10 },
      removeOptions: {
        staleTimeMs: 86400 * 1000,
      },
    });

    await this.deleteRepoWorkflowLogs({
      owner,
      repo,
      staleTimeMs: 86400 * 1000,
    });
  }

  async runListRepositories({
    owner,
    ownerLogin,
    repoLogPath,
    rawLogPath,
  }: RunListRepositoriesArgs) {
    await this.listRepositories({
      owner: owner ?? this.owner,
      ownerLogin: ownerLogin ?? owner ?? this.owner,
      repoLogPath,
      rawLogPath,
    });
  }

  async runDeleteRepositoryList({
    targetPath,
  }: RunDeleteRepositoryListOptions) {
    await this.deleteRepos({
      owner: this.owner,
      targetPath: targetPath ?? 'repos.json',
    });
  }

  /**
   *
   * @param ref branch name as glob pattern
   */
  async runListBranches({ owner, repo, ref }: RunListBranchesOptions) {
    const { data } = await this.getOctokit().rest.git.listMatchingRefs({
      owner: owner ?? this.owner,
      repo: repo ?? this.repo,
      ref: ref,
    });

    return data;
  }

  async runCleanupRepository() {
    const result = await this.addLabelsToIssue({
      owner: this.owner,
      repo: this.repo,
    });
    return result;
  }
}
