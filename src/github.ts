/* eslint-disable no-useless-escape */

import { faker } from '@faker-js/faker';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import _ from 'lodash';
import { Octokit } from 'octokit';
import parseGitConfig from 'parse-git-config';
import path from 'path';

export const branchPrefixes = ['feature', 'hotfix'] as const;
export const workflowStatus = [
  'completed',
  'action_required',
  'cancelled',
  'failure',
  'neutral',
  'skipped',
  'stale',
  'success',
  'timed_out',
  'in_progress',
  'queued',
  'requested',
  'waiting',
];
export const commitCategories = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'chore',
] as const;
export const DEFAULT = {
  maxCommits: 3,
  minCommits: 1,
  maxFiles: 4,
  minFiles: 1,
  numberOfIssues: 2,
  workingBranchPrefix: branchPrefixes[0],
  mainBranch: 'main',
  relativePath: '.gitarist',
  remote: 'origin',
  cron: '0 */6 * * 0-6',
  stale: 2, // days
  language: 'GO',
  ownerPlaceholder: '<OWNER>',
  repoPlaceholder: '<REPOSITORY>',
} as const;

enum MODE {
  BLOB = '120000',
  BLOB__FILE = '100644',
  BLOB__EXECUTABLE = '100755',
  TREE__DIRECTORY = '040000',
  COMMIT__SUBMODULE = '160000',
}

export type Language = 'GO' | 'PYTHON' | 'JAVA' | 'CPP' | 'TEXT';
export type SetupCommandOptions = {
  remote: string;
};
export type StartCommandOptions = {
  owner: string;
  repo: string;
  token: string;
} & {
  minCommits: number;
  maxCommits: number;
  minFiles: number;
  maxFiles: number;
  issues: number;
  workingBranchPrefix: BranchPrefix;
  mainBranch: MainBranch;
  stale: number;
};
export type BranchPrefix = (typeof branchPrefixes)[number]; // TypeScript 3.4+
export type MainBranch = 'main' | 'master' | string;
export type TreeParam = {
  path?: string | undefined;
  mode?: MODE;
  type?: 'blob' | 'tree' | 'commit' | undefined;
  sha?: string | undefined;
  content?: string | undefined;
};
export type IssueItem = {
  title: string;
  body: string;
  assignee?: string;
  /**
   * comma separated string
   */
  labels?: string;
};

export class Gitarist {
  private readonly _octokit;
  private readonly _owner: string;
  private readonly _repo: string;
  private readonly _token: string;
  private readonly labelsCandidates = [
    {
      name: 'enhancement',
      color: 'a2eeef',
      description: 'New feature or request',
    },
    {
      name: 'bug',
      color: 'd73a4a',
      description: "Something isn't working",
    },
    {
      name: 'documentation',
      color: '0075ca',
      description: 'Improvements or additions to documentation',
    },
    {
      name: 'duplicate',
      color: 'cfd3d7',
      description: 'This issue or pull request already exists',
    },
  ];
  private assigneeCandidates: string[] = [];
  private languageMap: Record<Language, { ext: string; comment: string }> = {
    GO: { ext: 'go', comment: '//' },
    PYTHON: { ext: 'py', comment: '#' },
    JAVA: { ext: 'java', comment: '//' },
    CPP: { ext: 'cc', comment: '//' },
    TEXT: { ext: 'txt', comment: '' },
  };

  constructor({ owner, repo, token }: { owner: string; repo: string; token: string }) {
    this._owner = owner;
    this._repo = repo;
    this._token = token;

    if (!this._owner) {
      throw new Error('Missing environment variable: "GITHUB_OWNER"');
    }

    if (!this._repo) {
      throw new Error('Missing environment variable: "GITHUB_REPO"');
    }

    if (!this._token) {
      throw new Error('Missing environment variable: "GITHUB_TOKEN"');
    }

    this._octokit = new Octokit({ auth: this._token });
    this.assigneeCandidates = [this._owner];
  }

  get owner() {
    return this._owner;
  }

  get repo() {
    return this._repo;
  }

  get octokit(): Octokit {
    return this._octokit;
  }

  static get logo() {
    return `
          _ __             _      __ 
   ____ _(_) /_____ ______(_)____/ /_
  / __ \`/ / __/ __ \`/ ___/ / ___/ __/
 / /_/ / / /_/ /_/ / /  / (__  ) /_
 \__, /_/\__/\__,_/_/  /_/____/\__/
/____/ 
`;
  }

  static get tokenIssueUrl() {
    return 'https://github.com/settings/tokens/new?description=GITHUB_TOKEN&scopes=repo,read:packages,read:org,delete_repo,workflow';
  }

  static getEnvSettingPageUrl({ owner, repo }: { owner: string; repo: string }) {
    return `https://github.com/${owner}/${repo}/settings/secrets/actions/new`;
  }

  /**
   * Create a github action file
   * @example '0 \*\/4 \* \* 0-6' means 'for every N hours Sunday to Saturday'
   */
  static getActionTemplate({
    cron = DEFAULT.cron,
    repo = '<REPO>',
    owner = '<USERNAME>',
  }: {
    cron?: string;
    repo?: string;
    owner?: string;
  }) {
    const template = `
    
name: Gitarist

on: 
  workflow_dispatch:
  schedule:
    - cron: '${cron}'

jobs:
  start:
    runs-on: ubuntu-latest
    env:
      GITHUB_OWNER: \${{ github.repository_owner }}
      GITHUB_REPO: \${{ github.event.repository.name }}
      # Create a secret key at,
      # ${this.tokenIssueUrl}
      # and register the secret key to action settings at,
      # ${Gitarist.getEnvSettingPageUrl({ owner, repo })}
      GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx gitarist start
`;

    return template;
  }

  /**
   * Create the .env file
   * @param owner
   * @param repo
   * @param token
   * @returns
   */
  static getEnvTemplate({ owner = '', repo = '', token = '' }) {
    const template = `
# gitarist    
GITHUB_OWNER="${owner}"
GITHUB_REPO="${repo}"
# ${Gitarist.tokenIssueUrl}
GITHUB_TOKEN="${token}"
`;

    return template;
  }

  /**
   * Setup a repository for gitarist which is creating a workflow file.
   */
  static async setup({ remote = DEFAULT.remote }: Partial<SetupCommandOptions>) {
    const gitConfigPath = path.join(process.cwd(), '.git', 'config');
    if (!existsSync(gitConfigPath)) {
      throw new Error(
        `Could not find git config file from this directory, ${gitConfigPath}. This is not a git repository. Maybe you should run "git init" first.`,
      );
    }

    const dotenvFile = '.env';
    const envPath = path.join(process.cwd(), dotenvFile);
    console.log(`Searching ${dotenvFile} file from ${envPath} ...`);
    if (existsSync(envPath)) {
      console.log(
        `\tThere is a ${dotenvFile} file already so template will be appended to the file.`,
      );
    } else {
      console.log(`\tCould not find a ${dotenvFile} file`);
    }

    const ymlPath = path.join(process.cwd(), '.github', 'workflows', 'gitarist.yml');
    console.log(`Searching gitarist workflow file from ${envPath} ...`);
    if (existsSync(ymlPath)) {
      console.log(`\tThere is a gitarist workflow file already at ${ymlPath}.`);
    } else {
      console.log(`\tCould not find a workflow file`);
    }

    const git = parseGitConfig.sync(
      readFileSync(path.join(process.cwd(), '.git', 'config'), 'utf8'),
    );
    const owner = git?.user?.name ?? DEFAULT.ownerPlaceholder;
    const repo =
      git[`remote "${remote}"`]?.url?.split('/')?.pop()?.replace('.git', '').replace('/', '') ??
      DEFAULT.repoPlaceholder;
    const githubWorkflowDirectory = path.join(process.cwd(), '.github', 'workflows');
    mkdirSync(githubWorkflowDirectory, { recursive: true });
    writeFileSync(
      path.join(githubWorkflowDirectory, 'gitarist.yml'),
      Gitarist.getActionTemplate({ owner, repo }),
      { encoding: 'utf8', flag: 'a+' },
    );
    writeFileSync(path.join(process.cwd(), '.env'), Gitarist.getEnvTemplate({ owner, repo }), {
      encoding: 'utf8',
      flag: 'a+',
    });

    console.log(['Generate a secret key settings:', Gitarist.tokenIssueUrl].join('\n'));
    // Open the browser to create a secret key
    const open = await import('open');
    await open.default(Gitarist.tokenIssueUrl, { wait: false });
    const envSettingPageUrl = Gitarist.getEnvSettingPageUrl({ owner, repo });
    console.log(`Register the secret key to action settings: ${envSettingPageUrl}`);
    console.log(
      'Go to repository > settings > Secrets and variables > Actions > New repository secret',
    );

    if (owner !== DEFAULT.ownerPlaceholder) {
      console.error(`It is unable to find git username`);
      return;
    }

    if (repo !== DEFAULT.repoPlaceholder) {
      console.error(`It is unable to find repository name.`);
      return;
    }

    await open.default(Gitarist.tokenIssueUrl, { wait: false });
    await open.default(envSettingPageUrl, { wait: false });
  }

  /**
   * create a commit
   * make a pull request
   * review it
   * merge it
   */
  async simulateActiveUser({
    maxCommits = DEFAULT.maxCommits,
    minCommits = DEFAULT.minCommits,
    maxFiles = DEFAULT.maxFiles,
    minFiles = DEFAULT.minFiles,
    numberOfIssues = DEFAULT.numberOfIssues,
    workingBranchPrefix = DEFAULT.workingBranchPrefix,
    mainBranch = DEFAULT.mainBranch,
    stale = DEFAULT.stale,
    language = DEFAULT.language,
  }: {
    maxCommits?: number;
    minCommits?: number;
    maxFiles?: number;
    minFiles?: number;
    numberOfIssues?: number;
    workingBranchPrefix?: BranchPrefix; // prefix of current working branch
    mainBranch?: MainBranch; // merge target branch
    stale?: number;
    language?: Language;
  }) {
    const olderThan = new Date(Date.now() - stale * 86400 * 1000);

    for (const key of Array(numberOfIssues).keys()) {
      console.debug(`issue: ${key + 1}/${numberOfIssues}`);
      await this.createCommitAndMakePullRequest({
        numberOfCommits: _.sample(_.range(minCommits, maxCommits + 1)) as number,
        numberOfFiles: _.sample(_.range(minFiles, maxFiles + 1)) as number,
        workingBranchPrefix,
        mainBranch,
        language,
      });
    }

    await this.deleteOldWorkflowLogs({ olderThan });
    await this.deleteOldFiles({ olderThan, mainBranch });
    await this.resolveAllReviewComments();
    await this.deleteOldIssues({ olderThan });
    await this.deleteCommentsOnIssueCreatedByBot();
    await this.deleteBranches({ ref: `heads/${workingBranchPrefix}` });
    await this.closeStaleIssues({ olderThan });
  }

  async closeStaleIssues({ olderThan }: { olderThan: Date }) {
    // close issues that are older than the specified date
    for await (const { data: issues } of this.octokit.paginate.iterator(
      this.octokit.rest.issues.listForRepo,
      {
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
        sort: 'created',
        direction: 'desc',
      },
    )) {
      for (const issue of issues) {
        if (new Date(issue.created_at).getTime() < new Date(olderThan).getTime()) {
          await this.octokit.rest.issues.update({
            owner: this.owner,
            repo: this.repo,
            issue_number: issue.number,
            state: 'closed',
          });
        }
      }
    }
  }

  async deleteOldIssues({ olderThan }: { olderThan: Date }) {
    for await (const { data: issues } of this.octokit.paginate.iterator(
      this.octokit.rest.issues.listForRepo,
      {
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
        sort: 'created',
        direction: 'desc',
      },
    )) {
      for (const issue of issues) {
        if (issue.pull_request?.url) {
          // if the issue is a PR, then deletion is prohibited
          continue;
        }

        if (new Date(issue.created_at).getTime() < new Date(olderThan).getTime()) {
          const query = `
          mutation DeleteIssue($input: DeleteIssueInput!) {
            deleteIssue(input: $input) {
              repository {
                name
              }
            }
          }
        `;
          try {
            const result = await this.octokit.graphql(query, {
              input: {
                issueId: issue.node_id,
              },
            });
            console.debug(result, issue.pull_request?.url);
          } catch (error: any) {
            // try-catch를 써야하는 이유는 다음과 같다. 깃헙은 이슈와 PR이 연동되어있다. 이슈에서 PR을 생성한 경우 이슈가 PR로 넘어가게되며 이슈는 더이상 삭제할 수 없게된다. 그리고 삭제 시도시 에러가 발생한다.
            console.debug(`message: ${error?.message}, url: ${issue.pull_request?.url}`);
          }
        }
      }
    }
  }

  /**
   * ref와 부분일치하는 브랜치
   * @example 'heads/feat' 이걸로 시작하는 모든 브랜치 삭제
   */
  async listBranches({ ref }: { ref: string }) {
    const { data: branches } = await this.octokit.rest.git.listMatchingRefs({
      owner: this.owner,
      repo: this.repo,
      ref,
    });
    console.debug(`branche names starts with ${ref}: [${branches.map(({ ref }) => ref).join()}]`);
    return branches;
  }

  /**
   * ref와 부분일치하는 브랜치 삭제
   * @example 'heads/feat' 으로 시작하는 모든 브랜치 삭제
   */
  async deleteBranches({ ref }: { ref: `heads/${string}` }) {
    const { data: refs } = await this.octokit.rest.git.listMatchingRefs({
      owner: this.owner,
      repo: this.repo,
      ref,
    });

    console.debug(
      `found branch names starting with ${ref}: [${refs.map(({ ref }) => ref).join()}]`,
    );

    for (let { ref } of refs) {
      if (ref.startsWith('refs/heads/')) {
        ref = ref.replace('refs/', '');
      }

      const { data } = await this.octokit.rest.git.deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref,
      });
      console.debug(data);
      console.debug(`delete branch. ref: ${ref}`);
    }
  }

  async deleteFolders({
    folderPaths,
    relative,
  }: {
    folderPaths: string[];
    /**
     * if true, then folderPaths are relative paths from the current working directory(process.cwd())
     */
    relative?: boolean;
  }) {
    if (relative) {
      folderPaths = folderPaths.map((folderPath) => path.join(process.cwd(), folderPath));
    }

    for (const folderPath of folderPaths) {
      if (!existsSync(folderPath) || !lstatSync(folderPath).isDirectory()) {
        continue;
      }
      console.warn(`delete folder. folderPath: ${folderPath}`);
      rmSync(folderPath, { recursive: true, force: true });
    }
  }

  async deleteCommentsOnIssueCreatedByBot() {
    for await (const issue of await this.octokit.paginate(this.octokit.rest.issues.list, {
      owner: this.owner,
      repo: this.repo,
      filter: 'all',
    })) {
      try {
        for await (const comment of await this.octokit.paginate(
          this.octokit.rest.issues.listComments,
          {
            owner: this.owner,
            repo: this.repo,
            issue_number: issue.number,
            // per_page: 100,
          },
        )) {
          if (comment.user?.login?.includes('[bot]')) {
            await this.octokit.rest.issues.deleteComment({
              owner: this.owner,
              repo: this.repo,
              comment_id: comment.id,
            });
            console.debug(
              `comment on issue deleted. issue: ${issue.number}, author: ${comment.user?.login}, comment: ${comment.id},`,
            );
          }
          //
        }
      } catch (error) {
        // NOTE: this.octokit.rest.issues.listComments 에서 comments가 없는 경우 emtpry array가 아닌 404를 반환하므로 try-catch가 필요하다.
      }
    }
  }

  /**
   * 현재 프로젝트에서 일정 기간이 지난 파일을 삭제한다. 실제 파일이 로컬에서 삭제되는게 중요한게 아니라 깃에서 삭제되는게 중요하다.
   */
  async deleteOldFiles({
    olderThan,
    mainBranch = DEFAULT.mainBranch,
  }: {
    olderThan: Date;
    mainBranch?: MainBranch;
  }): Promise<void> {
    console.debug('start to delete old files');
    const { data: branchRef } = await this.octokit.rest.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${mainBranch}`,
    });
    const latestCommitSha = branchRef.object.sha; // Get the latest commit SHA of the branch
    const { data: currentTree } = await this.octokit.rest.git.getTree({
      owner: this.owner,
      repo: this.repo,
      tree_sha: latestCommitSha,
      recursive: 'true',
    });
    const targetFilePaths = currentTree.tree
      .filter((file) => {
        const fullPath = path.join(process.cwd(), file.path ?? '');
        const createdAt = new Date(Number.parseInt(path.basename(fullPath))).getTime();
        const flag =
          file.type === 'blob' &&
          file.path?.startsWith(`${DEFAULT.relativePath}/`) &&
          !isNaN(createdAt) &&
          createdAt < new Date(olderThan).getTime();
        return flag;
      })
      .map((tree) => {
        console.debug(`will be deleted. path: ${tree.path}`);
        return tree.path;
      });

    if (targetFilePaths.length === 0) {
      return;
    }

    // Create a tree object with the file deletion
    const { data: tree } = await this.octokit.rest.git.createTree({
      owner: this.owner,
      repo: this.repo,
      base_tree: latestCommitSha,
      tree: targetFilePaths.map((path) => ({
        path,
        type: 'tree',
        mode: MODE.BLOB__FILE,
        sha: null, // To indicate file deletion
      })),
    });

    const newTreeSha = tree.sha;

    // Create a new commit object referencing the new tree and the previous commit
    const { data: newCommit } = await this.octokit.rest.git.createCommit({
      owner: this.owner,
      repo: this.repo,
      message: 'feat: clean up stale files',
      tree: newTreeSha,
      parents: [latestCommitSha],
    });

    // Update the branch reference to point to the new commit
    const { data: pushed } = await this.octokit.rest.git.updateRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${mainBranch}`,
      sha: newCommit.sha,
    });
    console.debug(`commit pushed. sha: ${pushed.object.sha}`);
  }

  async createIssuesFromJson({ relativePath }: { relativePath: string }) {
    const data = await readFile(path.join(process.cwd(), relativePath), 'utf8');

    try {
      const issueItems = JSON.parse(data);
      this.validateIssueTemplate(issueItems);
      await this.createMultipleIssues({ issueItems });
    } catch (error: any) {
      console.error(error.message);
    }
  }

  async createMultipleIssues({ issueItems }: { issueItems: IssueItem[] }) {
    for (const item of issueItems) {
      const { data: issue } = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: item.title,
        body: item.body,
        labels: item.labels?.split(',').map((label) => label.trim()),
      });
      if (!item.assignee) {
        continue;
      }
      const { status } = await this.octokit.rest.issues.checkUserCanBeAssigned({
        owner: this.owner,
        repo: this.repo,
        assignee: item.assignee,
      });
      if (status !== 204) {
        continue;
      }
      await this.octokit.rest.issues.addAssignees({
        repo: this.repo,
        owner: this.owner,
        issue_number: issue.number,
        assignees: [item.assignee],
      });
    }
  }

  /**
   * 과금되고 있는 github action을 감지한다.
   */
  async findWastedActionsOverAllRepositories() {
    for await (const { data: repositories } of this.octokit.paginate.iterator(
      this.octokit.rest.repos.listForAuthenticatedUser,
      {
        username: this.owner,
      },
    )) {
      for (const { name } of repositories) {
        for await (const { data: workflows } of this.octokit.paginate.iterator(
          this.octokit.rest.actions.listRepoWorkflows,
          {
            owner: this.owner,
            repo: name,
          },
        )) {
          for (const workflow of workflows) {
            /**
             * Github workflow ID can be found in url.
             * @example if the action url is https://github.com/<owner>/<repo>/actions/workflows/build-and-test.yml, then "build-and-test.yml" is workflow id'
             */
            const usages = await this.octokit.rest.actions.getWorkflowUsage({
              owner: this.owner,
              repo: name,
              workflow_id: workflow.id,
            });
            let data = {
              repo: name,
              workflowName: workflow.name,
            };
            if (usages.data.billable.UBUNTU) {
              data = { ...data, ...usages.data.billable.UBUNTU };
            }
            if (usages.data.billable.MACOS) {
              data = { ...data, ...usages.data.billable.MACOS };
            }
            if (usages.data.billable.WINDOWS) {
              data = { ...data, ...usages.data.billable.WINDOWS };
            }
          }
        }
      }
    }
  }

  async resolveAllReviewComments() {
    const MAX_ITERATION = 10;
    let iter = 0;
    let nextPullRequestCursor = null;
    let threadAfter = null;

    const listPullRequestsAndReviewThreadsQuery = `
      query ListRepos(
        $owner: String!
        $repo: String!
        $pullRequestFirst: Int!
        $threadFirst: Int!
        $pullRequestAfter: String
        $threadAfter: String
      ) {
        repository(owner: $owner, name: $repo) {
          pullRequests(
            first: $pullRequestFirst
            after: $pullRequestAfter
            orderBy: { field: CREATED_AT, direction: DESC }
          ) {
            edges {
              cursor
              node {
                number
                mergeable
                reviewThreads(first: $threadFirst, after: $threadAfter) {
                  edges {
                    node {
                      id
                      isResolved
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const resolvedThreadIds: string[] = [];
    // TODO: convert to octokit.graphql.paginate rather than MAX_ITERATION
    while (iter++ < MAX_ITERATION) {
      const queryResult: any = await this.octokit
        .graphql(listPullRequestsAndReviewThreadsQuery, {
          owner: this.owner,
          repo: this.repo,
          pullRequestFirst: 10,
          pullRequestAfter: nextPullRequestCursor, // cursor, base64 encoded string
          threadFirst: 10,
          threadAfter, // cursor, base64 encoded string
        })
        .catch((error: any) => {
          console.error(error.message);
        });

      if (!queryResult) {
        continue;
      }

      // edge는 pull request의 필드이름일뿐으로 다른의미는 없는 걸로 보임
      const edges = queryResult.repository.pullRequests.edges;

      if (edges?.length > 0) {
        if (typeof edges[0].node.number === 'number') {
          // console.debug(`pull requests: [${edges.join()}]`);
        }
        if (typeof edges[0] === 'number') {
          // console.debug(`pull requests: [${edges.join()}]`);
        }
      }
      // console.debug(`pull requests: [${edges.join()}]`);

      const unresolvedThreads = edges
        .map((edge: any) => edge.node.reviewThreads.edges.map(({ node }: any) => node))
        .flat()
        .filter((node: any) => node && !node.isResolved);
      const unresolvedThreadIds = unresolvedThreads.map((node: any) => node.id);

      console.debug(
        `unresolvedThreadIds(total: ${
          unresolvedThreadIds.length
        }): [${unresolvedThreadIds.join()}]`,
      );

      const resolveReviewThreadMutation = `
        mutation ResolveReviewThread($input: ResolveReviewThreadInput!) {
          resolveReviewThread(input: $input) {
            thread {
              id
            }
          } 
        }
      `;

      const mutationResultList: any[] = [];

      for (const threadId of unresolvedThreadIds) {
        let hasError = false;
        await this.octokit
          .graphql(resolveReviewThreadMutation, {
            input: {
              threadId,
            },
          })
          .then((response: any) => {
            console.debug(`resolved thread. threadId: ${threadId}`);
            resolvedThreadIds.push(threadId);
            mutationResultList.push(response);
          })
          .catch((error: any) => {
            console.error(error?.response?.data?.error);
            console.error(error.message);
            hasError = true;
          });

        if (hasError) {
          break;
        }
      }

      // 2개의 반복문으로 이루어져있음.
      // 1. pull request에 대한 반복이 외부 반복문
      // 2. comments thread에 대한 반복이 내부 반복문
      if (unresolvedThreads.length === 0) {
        threadAfter = null;
        nextPullRequestCursor = edges[edges.length - 1]?.cursor ?? null;
      } else {
        threadAfter = unresolvedThreads[unresolvedThreads.length - 1]?.id ?? null;
      }
      if (edges.length === 0) {
        break;
      }
    }

    return resolvedThreadIds;
  }

  /**
   * change pull request title and body
   */
  async changePullRequestData() {
    for await (const { data: pullRequests } of this.octokit.paginate.iterator(
      this.octokit.rest.pulls.list,
      {
        repo: this.repo,
        owner: this.owner,
        base: DEFAULT.mainBranch,
        state: 'closed',
        per_page: 100,
        sort: 'created',
      },
    )) {
      for (const pullRequest of pullRequests) {
        const isTarget = false;

        throw new Error('Write custom target condition when you are running this script!');

        if (!isTarget) {
          continue;
        }
        const pullRequestNumber = pullRequest.number;
        console.debug(`change pull request. pull request: #${pullRequest.number}`);
        await this.octokit.rest.pulls.update({
          owner: this.owner,
          repo: this.repo,
          pull_number: pullRequestNumber,
          title: `[${_.sample(commitCategories)}] ${faker.lorem.sentences(1)}`,
          body: faker.lorem.paragraphs(10),
        });
      }
    }
  }

  async deleteOldWorkflowLogs({ olderThan }: { olderThan: Date }) {
    const deleteWorkflowStatus = [
      'completed',
      'action_required',
      'cancelled',
      'failure',
      'neutral',
      'skipped',
      'success',
      'timed_out',
      'waiting',
    ];

    for await (const workflow of await this.octokit.paginate(
      this.octokit.rest.actions.listRepoWorkflows,
      {
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
      },
    )) {
      for await (const run of await this.octokit.paginate(
        this.octokit.rest.actions.listWorkflowRuns,
        {
          owner: this.owner,
          repo: this.repo,
          workflow_id: workflow.id,
        },
      )) {
        if (
          !(
            new Date(run.created_at) < new Date(olderThan) &&
            deleteWorkflowStatus.includes(run.status ?? '')
          )
        ) {
          continue;
        }
        await this.octokit.rest.actions
          .deleteWorkflowRun({
            owner: this.owner,
            repo: this.repo,
            run_id: run.id,
          })
          .then(() => console.debug(`delete workflow run. runId: ${run.id}`))
          .catch((error: any) => {
            console.error(error.message);
          });

        await this.octokit.rest.actions
          .deleteWorkflowRunLogs({
            owner: this.owner,
            repo: this.repo,
            run_id: run.id,
          })
          .then(() => console.debug(`delete workflow run logs. runId: ${run.id}`))
          .catch((error: any) => {
            console.error(error.message);
          });
      }
    }
  }

  private async createCommitAndMakePullRequest({
    numberOfCommits,
    numberOfFiles,
    mainBranch: targetBranch,
    workingBranchPrefix,
    language,
  }: {
    numberOfCommits: number;
    numberOfFiles: number;
    mainBranch: MainBranch;
    workingBranchPrefix: BranchPrefix;
    language: Language;
  }): Promise<number> {
    const relativePath = DEFAULT.relativePath;

    const { data: issue } = await this.octokit.rest.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: `[${_.sample<any>(commitCategories)}] ${faker.lorem.sentences(1)}`,
      body: faker.lorem.paragraphs(10),
      assignees: [_.sample<any>(this.assigneeCandidates)],
    });
    console.debug(`create an issue #${issue.number}`);

    const label = _.sample<any>(this.labelsCandidates);
    const { data: labels } = await this.octokit.rest.issues.listLabelsForRepo({
      owner: this.owner,
      repo: this.repo,
    });
    if (labels.every(({ name }) => name !== label.name)) {
      await this.octokit.rest.issues.createLabel({
        owner: this.owner,
        repo: this.repo,
        ...label,
      });
    }
    await this.octokit.rest.issues.addLabels({
      issue_number: issue.number,
      owner: this.owner,
      repo: this.repo,
      labels: [label.name],
    });

    console.debug(`comment on issues #${issue.number}`);
    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      body: faker.lorem.sentences(10),
      issue_number: issue.number,
    });

    let createdFilePathList: string[] = [];

    // get target branch's latest commit SHA and its tree's SHA
    const { data: targetRef } = await this.octokit.rest.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${targetBranch}`,
    });

    // Create a new branch based on the latest commit SHA of the base branch
    const mainBranch = `${workingBranchPrefix}/issue-${issue.number}`;
    console.debug(`create a new branch. refs/heads/${mainBranch}`);
    await this.octokit.rest.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${mainBranch}`,
      sha: targetRef.object.sha,
    });

    for (const commitCount of Array(numberOfCommits).keys()) {
      console.debug(`start to create a commit... (${commitCount + 1}/${numberOfCommits})`);

      console.debug(`create files. number of files: ${numberOfFiles}`);
      createdFilePathList = this.createFiles({
        numberOfFiles,
        relativePath,
        language,
      });

      // 해당 브랜치에 여러개의 파일 추가
      // 실제 파일의 폴더구조는 무시하고 깃에 포함시킬 파일의 폴더구조를 tree로 정의할 수 있다. 실제 파일은 전혀 다른 경로에 있어도 깃에는 특정 경로에 파일이 들어가도록 할 수 있다.
      const tree: TreeParam[] = [];
      // for (const filePath of FastGlob.glob.sync([`${relativePath}/*`], { absolute: false })) { }
      for (const filePath of createdFilePathList) {
        console.debug(`a file created. ${filePath}`);
        const { data: blob } = await this.octokit.rest.git.createBlob({
          owner: this.owner,
          repo: this.repo,
          content: readFileSync(filePath, 'utf8'),
          encoding: 'utf-8',
        });
        tree.push({
          path: `${relativePath}/${path.basename(filePath)}`,
          sha: blob.sha,
          mode: MODE.BLOB__FILE,
          type: 'blob',
        });
      }

      // get latest commit SHA
      const { data: latestCommit } = await this.octokit.rest.git.getCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: targetRef.object.sha,
      });

      // create a tree by attaching files based on the target branch's latest commit
      console.debug(`create a tree. base tree: ${latestCommit.tree.sha}`);
      const { data: newTree } = await this.octokit.rest.git.createTree({
        owner: this.owner,
        repo: this.repo,
        tree,
        base_tree: latestCommit.tree.sha,
      });

      const parents = [targetRef.object.sha];
      console.debug(`tree created. parents: [${parents.join()}]`);
      const { data: newCommit } = await this.octokit.rest.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        message: `${_.sample<any>(commitCategories)}: ${faker.lorem.sentences(1)}`,
        tree: newTree.sha,
        parents,
      });

      // git push (THE MOST IMPORTANT PART)
      console.debug(`push the commit. ${newCommit.sha}`);
      await this.octokit.rest.git.updateRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${mainBranch}`,
        sha: newCommit.sha,
        force: true,
      });
    }

    await this.createPullRequestAndReviewAndMerge({
      baseBranch: targetBranch,
      headBranch: `refs/heads/${mainBranch}`,
      issue: issue.number,
      commentTargetFilePath: `${relativePath}/${path.basename(createdFilePathList[0])}`, // first file path is used for comment
    });

    console.debug(`delete the source branch. ref: heads/${mainBranch}`);
    await this.octokit.rest.git
      .deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${mainBranch}`, // `heads/<branch_name>` or simply `<branch_name>`
      })
      .catch((error: any) => {
        // throws an error if "Automatically delete head branch" settins is enabled
        console.error(error.message);
      });

    // leave a comment after merge
    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      body: faker.lorem.sentences(10),
      issue_number: issue.number,
    });

    // clean files up
    await rm(path.join(process.cwd(), relativePath), {
      recursive: true,
      force: true,
      maxRetries: 10,
    }).catch((error: any) => {
      console.error(error.message);
    });
    return issue.number;
  }

  private validateIssueTemplate(issues: IssueItem[]) {
    issues.forEach((issue, index) => {
      if (!issue.title) {
        throw new Error(`[createIssuesFromJson][index: ${index}] Missing field: title`);
      }
      if (!issue.body) {
        throw new Error(`[createIssuesFromJson][index: ${index}] Missing field: body`);
      }
      if (issue.assignee === '') {
        throw new Error(`[createIssuesFromJson][index: ${index}] Invalid field: assignee`);
      }
    });
  }

  private async createPullRequestAndReviewAndMerge({
    baseBranch,
    headBranch,
    issue,
    commentTargetFilePath,
  }: {
    baseBranch: string;
    headBranch: string;
    issue: number;
    commentTargetFilePath: string;
  }) {
    console.debug(`base branch: refs/heads/${baseBranch}`);
    console.debug(`head branch: ${headBranch}`);

    const { data: pullRequest } = await this.octokit.rest.pulls.create({
      owner: this.owner,
      repo: this.repo,
      base: baseBranch,
      head: headBranch,
      issue,
      body: faker.lorem.paragraphs(10),
      draft: false,
    });

    if (!pullRequest) {
      console.error('pull request is not found');
      return;
    }

    const { data: reviewCommented } = await this.octokit.rest.pulls.createReview({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullRequest.number,
      event: 'COMMENT',
      comments: [
        {
          path: commentTargetFilePath,
          body: faker.lorem.sentences(3),
          line: 1,
        },
      ],
    });

    const reviewerCandidates = await this.octokit.rest.repos.listCollaborators({
      owner: this.owner,
      repo: this.repo,
      permission: 'maintain',
    });
    const reviewrs = reviewerCandidates.data
      .map((user) => user.login)
      .filter((login) => login !== this.owner);

    console.debug(`reviewer candidates: [${reviewrs.join()}]`);
    if (reviewrs.length === 0) {
      console.debug('Review by author is not allowed. No reviewer is assigned.');
    } else {
      // when a number of reviewer candidates is greater than 1
      await this.octokit.rest.pulls.requestReviewers({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullRequest.number,
        reviewers: [_.sample<any>(reviewrs)],
      });

      await this.octokit.rest.pulls.createReview({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullRequest.number,
        event: 'APPROVE',
        comments: [{ path: commentTargetFilePath, body: 'LGTM', line: 1 }],
      });

      await this.octokit.rest.pulls.submitReview({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullRequest.number,
        event: 'APPROVE',
        review_id: reviewCommented.id,
      });

      await this.octokit.rest.pulls.updateReview({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullRequest.number,
        review_id: reviewCommented.id,
        body: 'viewed',
      });
    }

    const listPullRequestsAndReviewThreadsQuery = `
      query ListRepos($owner: String!, $repo: String!, $pullRequestLast: Int!, $threadLast: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequests(last: $pullRequestLast, orderBy: { field: CREATED_AT, direction: DESC }) {
            edges {
              cursor
              node {
                number
                mergeable
                reviewThreads(last: $threadLast) {
                  edges {
                    node {
                      id
                      isResolved
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    // 이슈에서 연동된 PR이라서 검색이 안되는걸로 보임...
    const queryResult: any = await this.octokit.graphql(listPullRequestsAndReviewThreadsQuery, {
      owner: this.owner,
      repo: this.owner,
      pullRequestLast: 100,
      threadLast: 100,
    });

    const edges = queryResult.repository.pullRequests.edges;
    console.debug(`pull requests: [${edges.join()}]`);

    const threadIds = edges
      .map((edge: any) => edge.node.reviewThreads.edges.map(({ node }: any) => node))
      .flat()
      .filter((node: any) => node && !node.isResolved)
      .map((node: any) => node.id);

    console.debug(`threadsIds:[${threadIds.join()}]`);

    const resolveReviewThreadMutation = `
      mutation ResolveReviewThread($input: ResolveReviewThreadInput!) {
        resolveReviewThread(input: $input) {
          thread {
            id
          }
        }
      }
    `;
    for (const threadId of threadIds) {
      const mutationResult = await this.octokit.graphql(resolveReviewThreadMutation, {
        input: {
          threadId,
        },
      });
      console.debug(mutationResult);
    }

    // merge pull request
    const { data: mergeResult } = await this.octokit.rest.pulls.merge({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullRequest.number,
      merge_method: 'squash',
    });
    console.debug(`${mergeResult.message}; sha: ${mergeResult.sha}`);
  }

  private createFiles({
    numberOfFiles,
    relativePath,
    language,
  }: {
    numberOfFiles: number;
    relativePath: string;
    language: Language;
  }) {
    const directoryPath = path.join(process.cwd(), relativePath);
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }

    return Array.from({ length: numberOfFiles })
      .map(() => {
        try {
          const filePath = path.join(
            directoryPath,
            `${Date.now().toString()}.${this.languageMap[language].ext}`,
          );
          writeFileSync(filePath, faker.lorem.paragraphs(10), {
            encoding: 'utf8',
            flag: 'a+',
          });
          return filePath;
        } catch (error) {
          console.error(error);
          return '';
        }
      })
      .filter(Boolean);
  }
}
