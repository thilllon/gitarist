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
import { GitaristTemplates } from './gitarist-template';
import { tokenIssueUrl } from './gitarist.constant';

export class GitaristRunner extends Gitarist {
  constructor({ dotenv: dotenvConfig = {} }: GitaristRunnerConfig = {}) {
    dotenv.config(dotenvConfig);

    const owner = process.env.GITARIST_OWNER;
    const repo = process.env.GITARIST_REPO;
    const authToken = process.env.GITARIST_TOKEN;

    super({ owner, repo, authToken });
  }

  /**
   * Setup a repository for gitarist which is creating a workflow file.
   */
  runInitialize({ dir = '' }: { dir?: string }) {
    const githubWorkflowDirectory = path.join(process.cwd(), dir, '.github', 'workflows');
    mkdirSync(githubWorkflowDirectory, { recursive: true });
    writeFileSync(path.join(githubWorkflowDirectory, 'gitarist.yml'), GitaristTemplates.getActionTemplate(), {
      encoding: 'utf8',
      flag: 'w+',
    });

    writeFileSync(path.join(process.cwd(), dir, '.env'), GitaristTemplates.getEnvTemplate(), {
      encoding: 'utf8',
      flag: 'a+',
    });

    console.log(`\nGenerate a secret key settings: ${tokenIssueUrl}`);
    console.log(`\nRegister the secret key to action settings:`);
    console.log(`https://github.com/<USERNAME>/${dir}/settings/new`);
  }

  /**
   * Imitate an active user.
   * creating commits, issue reporting, make pull requests, and delete workflow logs.
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

    await this.createCommits({
      owner,
      repo,
      branch: 'main',
      numFiles: { min: minFiles ?? 1, max: maxFiles ?? 10 },
      numCommits: { min: minCommits ?? 1, max: maxCommits ?? 10 },
      removeOptions: { staleTimeMs: 86400 * 1000 },
    });

    await this.mimicIssueReport({ owner, repo });

    await this.mimicPullRequest({
      owner,
      repo,
      reviewOptions: { content: 'LGTM', reviewers: [] },
      mergeOptions: { mergeMethod: 'rebase' },
    });

    await this.deleteRepoWorkflowLogs({ owner, repo, staleTimeMs: 86400 * 1000 });
  }

  async runListRepositories({ owner, ownerLogin, repoLogPath, rawLogPath, perPage }: RunListRepositoriesArgs) {
    await this.listRepositories({
      owner: owner ?? this.owner,
      ownerLogin: ownerLogin ?? owner ?? this.owner,
      repoLogPath,
      rawLogPath,
      perPage,
    });
  }

  async runDeleteRepositoryList({ targetPath }: RunDeleteRepositoryListOptions) {
    await this.deleteRepositoryList({ owner: this.owner, targetPath: targetPath ?? 'repos.json' });
  }

  /**
   *
   * @param ref branch name as glob pattern
   */
  async runListGitBranch({ owner, repo, ref }: RunListBranchesOptions) {
    const { data } = await this.getOctokit().rest.git.listMatchingRefs({
      owner: owner ?? this.owner,
      repo: repo ?? this.repo,
      ref,
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
