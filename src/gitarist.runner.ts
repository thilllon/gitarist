import chalk from 'chalk';
import dotenv from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { Gitarist } from './gitarist';
import {
  ChangeIssueTitleAndAddLabelsOptions,
  CloseIssuesOptions,
  CreateCommitsOptions,
  CreateFilesOptions,
  CreateIssuesOptions,
  CreatePullRequestOptions,
  DeleteReposOptions,
  DeleteRepoWorkflowLogsOptions,
  FindWastedActionsOptions,
  GetStaleWorkflowRunsOptions,
  ListRepositoriesOptions,
  MimicIssueReportOptions,
  MimicPullRequestOptions,
  RemoveCommentsOnIssueByBotOptions,
  RemoveStaleFilesOptions,
} from './gitarist.interface';
import { RunListRepositoriesArgs } from './gitarist.runner.interface';
import { Templates } from './gitarist.template';

export class GitaristRunner extends Gitarist {
  constructor() {
    dotenv.config();

    const owner = process.env.GITARIST_OWNER;
    const repo = process.env.GITARIST_REPO;
    const authToken = process.env.GITARIST_TOKEN;

    if (!owner) {
      throw new Error('Missing environment variable: "GITARIST_OWNER"');
    }

    if (!repo) {
      throw new Error('Missing environment variable: "GITARIST_REPO"');
    }

    if (!authToken) {
      throw new Error('Missing environment variable: "GITARIST_TOKEN"');
    }

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
    console.log(
      chalk.greenBright.bold(
        `https://github.com/settings/tokens/new?description=GITARIST_TOKEN&scopes=repo,read:packages,read:org,delete_repo,workflow`
      )
    );

    console.log(`\nRegister the secret key to action settings:`);
    console.log(
      chalk.greenBright.bold(
        `https://github.com/<USERNAME>/${dir}/settings/new`
      )
    );
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

  async runListRepository({
    owner,
    ownerLogin,
    repoLogPath,
    rawLogPath,
  }: RunListRepositoriesArgs) {
    await this.listRepository({
      owner: owner ?? this.owner,
      ownerLogin: ownerLogin ?? owner ?? this.owner,
      repoLogPath,
      rawLogPath,
    });
  }

  async runDeleteRepositoryList() {
    await this.deleteRepos({
      owner: this.owner,
      targetPath: 'repos.json',
    });
  }

  /**
   *
   * @param ref branch name as glob pattern
   */
  async runListBranches({
    owner,
    repo,
    ref,
  }: {
    owner?: string;
    repo?: string;
    ref: string;
  }) {
    const { data } = await this.getOctokit().rest.git.listMatchingRefs({
      owner: owner ?? this.owner,
      repo: repo ?? this.repo,
      ref: ref,
    });

    return data;
  }

  // --------------------------------
  // for testing private methods
  // --------------------------------

  __createCommitFiles(options: CreateFilesOptions) {
    return this.createCommitFiles(options);
  }

  __removeStaleFiles(options: RemoveStaleFilesOptions) {
    return this.removeStaleFiles(options);
  }

  async __createCommits(options: CreateCommitsOptions) {
    return this.createCommits(options);
  }

  async __createIssues(options: CreateIssuesOptions) {
    return this.createIssues(options);
  }

  async __closeIssues(options: CloseIssuesOptions) {
    return this.closeIssues(options);
  }

  async __listRepositories(options: ListRepositoriesOptions) {
    return this.listRepository(options);
  }

  async __deleteRepos(options: DeleteReposOptions) {
    return this.deleteRepos(options);
  }

  async __findWastedActions(options: FindWastedActionsOptions) {
    return this.findWastedActions(options);
  }

  async __deleteRepoWorkflowLogs(options: DeleteRepoWorkflowLogsOptions) {
    return this.deleteRepoWorkflowLogs(options);
  }

  async __createPullRequest(options: CreatePullRequestOptions) {
    return this.createPullRequest(options);
  }

  async __removeCommentsOnIssueByBot(
    options: RemoveCommentsOnIssueByBotOptions
  ) {
    return this.removeCommentsOnIssueByBot(options);
  }

  async __changeIssueTitleAndAddLabels(
    options: ChangeIssueTitleAndAddLabelsOptions
  ) {
    return this.changeIssueTitleAndAddLabels(options);
  }

  async __getStaleWorkflowRuns(options: GetStaleWorkflowRunsOptions) {
    return this.getStaleWorkflowRuns(options);
  }

  async __mimicIssueReport(options: MimicIssueReportOptions) {
    return this.mimicIssueReport(options);
  }

  async __mimicPullRequest(options: MimicPullRequestOptions) {
    return this.mimicPullRequest(options);
  }

  async __getRateLimit(options: any) {
    return this.getRateLimit(options);
  }

  async __removeBranch(options: any) {
    return this.removeBranch(options);
  }
}
