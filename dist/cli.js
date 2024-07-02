#!/usr/bin/env node
'use strict';

var faker = require('@faker-js/faker');
var fs = require('fs');
var promises = require('fs/promises');
var _ = require('lodash');
var octokit = require('octokit');
var parseGitConfig = require('parse-git-config');
var path = require('path');
var commander = require('commander');
var dotenv = require('dotenv');
var z = require('zod');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var fs__default = /*#__PURE__*/_interopDefault(fs);
var ___default = /*#__PURE__*/_interopDefault(_);
var parseGitConfig__default = /*#__PURE__*/_interopDefault(parseGitConfig);
var path__default = /*#__PURE__*/_interopDefault(path);
var dotenv__default = /*#__PURE__*/_interopDefault(dotenv);
var z__default = /*#__PURE__*/_interopDefault(z);

var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// package.json
var name, version, description;
var init_package = __esm({
  "package.json"() {
    name = "gitarist";
    version = "1.2.10";
    description = "A CLI tool to utilize Octokit";
  }
});
var branchPrefixes, commitCategories, DEFAULT, Gitarist;
var init_github = __esm({
  "src/github.ts"() {
    branchPrefixes = ["feature", "hotfix"];
    commitCategories = [
      "feat",
      "fix",
      "docs",
      "style",
      "refactor",
      "perf",
      "test",
      "chore"
    ];
    DEFAULT = {
      maxCommits: 3,
      minCommits: 1,
      maxFiles: 4,
      minFiles: 1,
      numberOfIssues: 2,
      workingBranchPrefix: branchPrefixes[0],
      mainBranch: "main",
      relativePath: ".gitarist",
      remote: "origin",
      cron: "0 */6 * * 0-6",
      stale: 2,
      // days
      language: "GO",
      ownerPlaceholder: "<OWNER>",
      repoPlaceholder: "<REPOSITORY>"
    };
    Gitarist = class _Gitarist {
      _octokit;
      _owner;
      _repo;
      _token;
      labelsCandidates = [
        {
          name: "enhancement",
          color: "a2eeef",
          description: "New feature or request"
        },
        {
          name: "bug",
          color: "d73a4a",
          description: "Something isn't working"
        },
        {
          name: "documentation",
          color: "0075ca",
          description: "Improvements or additions to documentation"
        },
        {
          name: "duplicate",
          color: "cfd3d7",
          description: "This issue or pull request already exists"
        }
      ];
      assigneeCandidates = [];
      languageMap = {
        GO: { ext: "go", comment: "//" },
        PYTHON: { ext: "py", comment: "#" },
        JAVA: { ext: "java", comment: "//" },
        CPP: { ext: "cc", comment: "//" },
        TEXT: { ext: "txt", comment: "" }
      };
      constructor({ owner, repo, token }) {
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
        this._octokit = new octokit.Octokit({ auth: this._token });
        this.assigneeCandidates = [this._owner];
      }
      get owner() {
        return this._owner;
      }
      get repo() {
        return this._repo;
      }
      get octokit() {
        return this._octokit;
      }
      static get logo() {
        return `
          _ __             _      __ 
   ____ _(_) /_____ ______(_)____/ /_
  / __ \`/ / __/ __ \`/ ___/ / ___/ __/
 / /_/ / / /_/ /_/ / /  / (__  ) /_
 __, /_/__/__,_/_/  /_/____/__/
/____/ 
`;
      }
      static get tokenIssueUrl() {
        return "https://github.com/settings/tokens/new?description=GITHUB_TOKEN&scopes=repo,read:packages,read:org,delete_repo,workflow";
      }
      static getEnvSettingPageUrl({ owner, repo }) {
        return `https://github.com/${owner}/${repo}/settings/secrets/actions/new`;
      }
      /**
       * Create a github action file
       * @example '0 \*\/4 \* \* 0-6' means 'for every N hours Sunday to Saturday'
       */
      static getActionTemplate({
        cron = DEFAULT.cron,
        repo = "<REPO>",
        owner = "<USERNAME>"
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
      # ${_Gitarist.getEnvSettingPageUrl({ owner, repo })}
      GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
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
      static getEnvTemplate({ owner = "", repo = "", token = "" }) {
        const template = `
# gitarist    
GITHUB_OWNER="${owner}"
GITHUB_REPO="${repo}"
# ${_Gitarist.tokenIssueUrl}
GITHUB_TOKEN="${token}"
`;
        return template;
      }
      /**
       * Setup a repository for gitarist which is creating a workflow file.
       */
      static async setup({ remote = DEFAULT.remote }) {
        const gitConfigPath = path__default.default.join(process.cwd(), ".git", "config");
        if (!fs.existsSync(gitConfigPath)) {
          throw new Error(
            `Could not find git config file from this directory, ${gitConfigPath}. This is not a git repository. Maybe you should run "git init" first.`
          );
        }
        const dotenvFile = ".env";
        const envPath = path__default.default.join(process.cwd(), dotenvFile);
        console.log(`Searching ${dotenvFile} file from ${envPath} ...`);
        if (fs.existsSync(envPath)) {
          console.log(
            `	There is a ${dotenvFile} file already so template will be appended to the file.`
          );
        } else {
          console.log(`	Could not find a ${dotenvFile} file`);
        }
        const ymlPath = path__default.default.join(process.cwd(), ".github", "workflows", "gitarist.yml");
        console.log(`Searching gitarist workflow file from ${envPath} ...`);
        if (fs.existsSync(ymlPath)) {
          console.log(`	There is a gitarist workflow file already at ${ymlPath}.`);
        } else {
          console.log(`	Could not find a workflow file`);
        }
        const git = parseGitConfig__default.default.sync(
          fs.readFileSync(path__default.default.join(process.cwd(), ".git", "config"), "utf8")
        );
        const owner = git?.user?.name ?? DEFAULT.ownerPlaceholder;
        const repo = git[`remote "${remote}"`]?.url?.split("/")?.pop()?.replace(".git", "").replace("/", "") ?? DEFAULT.repoPlaceholder;
        const githubWorkflowDirectory = path__default.default.join(process.cwd(), ".github", "workflows");
        fs.mkdirSync(githubWorkflowDirectory, { recursive: true });
        fs.writeFileSync(
          path__default.default.join(githubWorkflowDirectory, "gitarist.yml"),
          _Gitarist.getActionTemplate({ owner, repo }),
          { encoding: "utf8", flag: "a+" }
        );
        fs.writeFileSync(path__default.default.join(process.cwd(), ".env"), _Gitarist.getEnvTemplate({ owner, repo }), {
          encoding: "utf8",
          flag: "a+"
        });
        console.log(["Generate a secret key settings:", _Gitarist.tokenIssueUrl].join("\n"));
        const open = await import('open');
        await open.default(_Gitarist.tokenIssueUrl, { wait: false });
        const envSettingPageUrl = _Gitarist.getEnvSettingPageUrl({ owner, repo });
        console.log(`Register the secret key to action settings: ${envSettingPageUrl}`);
        console.log(
          "Go to repository > settings > Secrets and variables > Actions > New repository secret"
        );
        if (owner !== DEFAULT.ownerPlaceholder) {
          console.error(`It is unable to find git username`);
          return;
        }
        if (repo !== DEFAULT.repoPlaceholder) {
          console.error(`It is unable to find repository name.`);
          return;
        }
        await open.default(_Gitarist.tokenIssueUrl, { wait: false });
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
        language = DEFAULT.language
      }) {
        for (const key of Array(numberOfIssues).keys()) {
          console.debug(`issue: ${key + 1}/${numberOfIssues}`);
          await this.createCommitAndMakePullRequest({
            numberOfCommits: ___default.default.sample(___default.default.range(minCommits, maxCommits + 1)),
            numberOfFiles: ___default.default.sample(___default.default.range(minFiles, maxFiles + 1)),
            workingBranchPrefix,
            mainBranch,
            language
          });
        }
        const olderThan = new Date(Date.now() - stale * 86400 * 1e3);
        await this.deleteOldWorkflowLogs({ olderThan });
        await this.deleteOldFiles({ olderThan, mainBranch });
        await this.resolveAllReviewComments();
        await this.deleteOldIssues({ olderThan });
        await this.deleteCommentsAtIssueByBot();
        await this.deleteBranches({ ref: `heads/${workingBranchPrefix}` });
        await this.closeStaleIssues({ olderThan });
      }
      async closeStaleIssues({ olderThan }) {
        for await (const { data: issues } of this.octokit.paginate.iterator(
          this.octokit.rest.issues.listForRepo,
          {
            owner: this.owner,
            repo: this.repo,
            per_page: 100,
            sort: "created",
            direction: "desc"
          }
        )) {
          for (const issue of issues) {
            if (new Date(issue.created_at).getTime() < new Date(olderThan).getTime()) {
              await this.octokit.rest.issues.update({
                owner: this.owner,
                repo: this.repo,
                issue_number: issue.number,
                state: "closed"
              });
            }
          }
        }
      }
      async deleteOldIssues({ olderThan }) {
        for await (const { data: issues } of this.octokit.paginate.iterator(
          this.octokit.rest.issues.listForRepo,
          {
            owner: this.owner,
            repo: this.repo,
            per_page: 100,
            sort: "created",
            direction: "desc"
          }
        )) {
          for (const issue of issues) {
            if (issue.pull_request?.url) {
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
                    issueId: issue.node_id
                  }
                });
                console.debug(result, issue.pull_request?.url);
              } catch (error) {
                console.debug(error?.message, issue.pull_request?.url);
              }
            }
          }
        }
      }
      /**
       * ref와 부분일치하는 브랜치
       * @example 'heads/feat' 이걸로 시작하는 모든 브랜치 삭제
       */
      async listBranches({ ref }) {
        const { data: branches } = await this.octokit.rest.git.listMatchingRefs({
          owner: this.owner,
          repo: this.repo,
          ref
        });
        console.debug(`branche names starts with ${ref}: [${branches.map(({ ref: ref2 }) => ref2).join()}]`);
        return branches;
      }
      /**
       * ref와 부분일치하는 브랜치
       * @example 'heads/feat' 이걸로 시작하는 모든 브랜치 삭제
       */
      async deleteBranches({
        ref,
        mainBranch = DEFAULT.mainBranch
      }) {
        const { data: refs } = await this.octokit.rest.git.listMatchingRefs({
          owner: this.owner,
          repo: this.repo,
          ref
        });
        console.debug(`branche names starts with ${ref}: [${refs.map(({ ref: ref2 }) => ref2).join()}]`);
        for (let { ref: ref2 } of refs) {
          if (ref2.startsWith("refs/heads/")) {
            ref2 = ref2.replace("refs/", "");
          }
          console.debug(`delete branch. ref: ${ref2}`);
          await this.octokit.rest.git.updateRef({
            owner: this.owner,
            repo: this.repo,
            sha: "",
            // empty SHA denotes deletion of the branch
            ref: `heads/${mainBranch}`
          });
        }
      }
      async deleteFolder({
        folderPaths,
        relative
      }) {
        if (relative) {
          folderPaths = folderPaths.map((folderPath) => path__default.default.join(process.cwd(), folderPath));
        }
        for (const folderPath of folderPaths) {
          if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
            continue;
          }
          console.warn(`delete folder. folderPath: ${folderPath}`);
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
      }
      async deleteCommentsAtIssueByBot() {
        for await (const issue of await this.octokit.paginate(this.octokit.rest.issues.list, {
          owner: this.owner,
          repo: this.repo,
          filter: "all"
        })) {
          for await (const comment of await this.octokit.paginate(
            this.octokit.rest.issues.listComments,
            {
              owner: this.owner,
              repo: this.repo,
              issue_number: issue.number,
              per_page: 100
            }
          )) {
            if (comment.user?.login?.includes("[bot]")) {
              console.debug(`remove comment issue. issue: ${issue.number}, comment: ${comment.id}`);
              await this.octokit.rest.issues.deleteComment({
                owner: this.owner,
                repo: this.repo,
                comment_id: comment.id
              });
            }
          }
        }
      }
      /**
       * 현재 프로젝트에서 일정 기간이 지난 파일을 삭제한다. 실제 파일이 로컬에서 삭제되는게 중요한게 아니라 깃에서 삭제되는게 중요하다.
       */
      async deleteOldFiles({
        olderThan,
        mainBranch = DEFAULT.mainBranch
      }) {
        console.debug("start to delete old files");
        const { data: branchRef } = await this.octokit.rest.git.getRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${mainBranch}`
        });
        const latestCommitSha = branchRef.object.sha;
        const { data: currentTree } = await this.octokit.rest.git.getTree({
          owner: this.owner,
          repo: this.repo,
          tree_sha: latestCommitSha,
          recursive: "true"
        });
        const targetFilePaths = currentTree.tree.filter((file) => {
          const fullPath = path__default.default.join(process.cwd(), file.path ?? "");
          const createdAt = new Date(Number.parseInt(path__default.default.basename(fullPath))).getTime();
          const flag = file.type === "blob" && file.path?.startsWith(`${DEFAULT.relativePath}/`) && !isNaN(createdAt) && createdAt < new Date(olderThan).getTime();
          return flag;
        }).map((tree2) => {
          console.debug(`will be deleted. ${tree2.path}}`);
          return tree2.path;
        });
        if (targetFilePaths.length === 0) {
          return;
        }
        const { data: tree } = await this.octokit.rest.git.createTree({
          owner: this.owner,
          repo: this.repo,
          base_tree: latestCommitSha,
          tree: targetFilePaths.map((path3) => ({
            path: path3,
            type: "tree",
            mode: "100644" /* BLOB__FILE */,
            sha: null
            // To indicate file deletion
          }))
        });
        const newTreeSha = tree.sha;
        const { data: newCommit } = await this.octokit.rest.git.createCommit({
          owner: this.owner,
          repo: this.repo,
          message: "feat: clean up stale files",
          tree: newTreeSha,
          parents: [latestCommitSha]
        });
        const { data: pushed } = await this.octokit.rest.git.updateRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${mainBranch}`,
          sha: newCommit.sha
        });
        console.debug(`commit pushed. sha: ${pushed.object.sha}`);
      }
      async createIssuesFromJson({ relativePath }) {
        const data = await promises.readFile(path__default.default.join(process.cwd(), relativePath), "utf8");
        try {
          const issueItems = JSON.parse(data);
          this.validateIssueTemplate(issueItems);
          await this.createMultipleIssues({ issueItems });
        } catch (error) {
          console.error(error.message);
        }
      }
      async createMultipleIssues({ issueItems }) {
        for (const item of issueItems) {
          const { data: issue } = await this.octokit.rest.issues.create({
            owner: this.owner,
            repo: this.repo,
            title: item.title,
            body: item.body,
            labels: item.labels?.split(",").map((label) => label.trim())
          });
          if (!item.assignee) {
            continue;
          }
          const { status } = await this.octokit.rest.issues.checkUserCanBeAssigned({
            owner: this.owner,
            repo: this.repo,
            assignee: item.assignee
          });
          if (status !== 204) {
            continue;
          }
          await this.octokit.rest.issues.addAssignees({
            repo: this.repo,
            owner: this.owner,
            issue_number: issue.number,
            assignees: [item.assignee]
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
            username: this.owner
          }
        )) {
          for (const { name: name2 } of repositories) {
            for await (const { data: workflows } of this.octokit.paginate.iterator(
              this.octokit.rest.actions.listRepoWorkflows,
              {
                owner: this.owner,
                repo: name2
              }
            )) {
              for (const workflow of workflows) {
                const usages = await this.octokit.rest.actions.getWorkflowUsage({
                  owner: this.owner,
                  repo: name2,
                  workflow_id: workflow.id
                });
                let data = {
                  repo: name2,
                  workflowName: workflow.name
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
        const resolvedThreadIds = [];
        while (iter++ < MAX_ITERATION) {
          const queryResult = await this.octokit.graphql(listPullRequestsAndReviewThreadsQuery, {
            owner: this.owner,
            repo: this.repo,
            pullRequestFirst: 10,
            pullRequestAfter: nextPullRequestCursor,
            // cursor, base64 encoded string
            threadFirst: 10,
            threadAfter
            // cursor, base64 encoded string
          }).catch((error) => {
            console.error(error.message);
          });
          if (!queryResult) {
            continue;
          }
          const edges = queryResult.repository.pullRequests.edges;
          if (edges?.length > 0) {
            if (typeof edges[0].node.number === "number") ;
            if (typeof edges[0] === "number") ;
          }
          const unresolvedThreads = edges.map((edge) => edge.node.reviewThreads.edges.map(({ node }) => node)).flat().filter((node) => node && !node.isResolved);
          const unresolvedThreadIds = unresolvedThreads.map((node) => node.id);
          console.debug(
            `unresolvedThreadIds(total: ${unresolvedThreadIds.length}): [${unresolvedThreadIds.join()}]`
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
          for (const threadId of unresolvedThreadIds) {
            let hasError = false;
            await this.octokit.graphql(resolveReviewThreadMutation, {
              input: {
                threadId
              }
            }).then((response) => {
              console.debug(`resolved thread. threadId: ${threadId}`);
              resolvedThreadIds.push(threadId);
            }).catch((error) => {
              console.error(error?.response?.data?.error);
              console.error(error.message);
              hasError = true;
            });
            if (hasError) {
              break;
            }
          }
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
            state: "closed",
            per_page: 100,
            sort: "created"
          }
        )) {
          for (const pullRequest of pullRequests) {
            throw new Error("Write custom target condition when you are running this script!");
          }
        }
      }
      async deleteOldWorkflowLogs({ olderThan }) {
        const deleteWorkflowStatus = [
          "completed",
          "action_required",
          "cancelled",
          "failure",
          "neutral",
          "skipped",
          "success",
          "timed_out",
          "waiting"
        ];
        for await (const workflow of await this.octokit.paginate(
          this.octokit.rest.actions.listRepoWorkflows,
          {
            owner: this.owner,
            repo: this.repo,
            per_page: 100
          }
        )) {
          for await (const run of await this.octokit.paginate(
            this.octokit.rest.actions.listWorkflowRuns,
            {
              owner: this.owner,
              repo: this.repo,
              workflow_id: workflow.id
            }
          )) {
            if (!(new Date(run.created_at) < new Date(olderThan) && deleteWorkflowStatus.includes(run.status ?? ""))) {
              continue;
            }
            await this.octokit.rest.actions.deleteWorkflowRun({
              owner: this.owner,
              repo: this.repo,
              run_id: run.id
            }).then(() => console.debug(`delete workflow run. runId: ${run.id}`)).catch((error) => {
              console.error(error.message);
            });
            await this.octokit.rest.actions.deleteWorkflowRunLogs({
              owner: this.owner,
              repo: this.repo,
              run_id: run.id
            }).then(() => console.debug(`delete workflow run logs. runId: ${run.id}`)).catch((error) => {
              console.error(error.message);
            });
          }
        }
      }
      async createCommitAndMakePullRequest({
        numberOfCommits,
        numberOfFiles,
        mainBranch: targetBranch,
        workingBranchPrefix,
        language
      }) {
        const relativePath = DEFAULT.relativePath;
        const { data: issue } = await this.octokit.rest.issues.create({
          owner: this.owner,
          repo: this.repo,
          title: `[${___default.default.sample(commitCategories)}] ${faker.faker.lorem.sentences(1)}`,
          body: faker.faker.lorem.paragraphs(10),
          assignees: [___default.default.sample(this.assigneeCandidates)]
        });
        console.debug(`create an issue #${issue.number}`);
        const label = ___default.default.sample(this.labelsCandidates);
        const { data: labels } = await this.octokit.rest.issues.listLabelsForRepo({
          owner: this.owner,
          repo: this.repo
        });
        if (labels.every(({ name: name2 }) => name2 !== label.name)) {
          await this.octokit.rest.issues.createLabel({
            owner: this.owner,
            repo: this.repo,
            ...label
          });
        }
        await this.octokit.rest.issues.addLabels({
          issue_number: issue.number,
          owner: this.owner,
          repo: this.repo,
          labels: [label.name]
        });
        console.debug(`comment on issues #${issue.number}`);
        await this.octokit.rest.issues.createComment({
          owner: this.owner,
          repo: this.repo,
          body: faker.faker.lorem.sentences(10),
          issue_number: issue.number
        });
        let createdFilePathList = [];
        const { data: targetRef } = await this.octokit.rest.git.getRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${targetBranch}`
        });
        const mainBranch = `${workingBranchPrefix}/issue-${issue.number}`;
        console.debug(`create a new branch. refs/heads/${mainBranch}`);
        await this.octokit.rest.git.createRef({
          owner: this.owner,
          repo: this.repo,
          ref: `refs/heads/${mainBranch}`,
          sha: targetRef.object.sha
        });
        for (const commitCount of Array(numberOfCommits).keys()) {
          console.debug(`start to create a commit... (${commitCount + 1}/${numberOfCommits})`);
          console.debug(`create files. number of files: ${numberOfFiles}`);
          createdFilePathList = this.createFiles({
            numberOfFiles,
            relativePath,
            language
          });
          const tree = [];
          for (const filePath of createdFilePathList) {
            console.debug(`a file created. ${filePath}`);
            const { data: blob } = await this.octokit.rest.git.createBlob({
              owner: this.owner,
              repo: this.repo,
              content: fs.readFileSync(filePath, "utf8"),
              encoding: "utf-8"
            });
            tree.push({
              path: `${relativePath}/${path__default.default.basename(filePath)}`,
              sha: blob.sha,
              mode: "100644" /* BLOB__FILE */,
              type: "blob"
            });
          }
          const { data: latestCommit } = await this.octokit.rest.git.getCommit({
            owner: this.owner,
            repo: this.repo,
            commit_sha: targetRef.object.sha
          });
          console.debug(`create a tree. base tree: ${latestCommit.tree.sha}`);
          const { data: newTree } = await this.octokit.rest.git.createTree({
            owner: this.owner,
            repo: this.repo,
            tree,
            base_tree: latestCommit.tree.sha
          });
          const parents = [targetRef.object.sha];
          console.debug(`tree created. parents: [${parents.join()}]`);
          const { data: newCommit } = await this.octokit.rest.git.createCommit({
            owner: this.owner,
            repo: this.repo,
            message: `${___default.default.sample(commitCategories)}: ${faker.faker.lorem.sentences(1)}`,
            tree: newTree.sha,
            parents
          });
          console.debug(`push the commit. ${newCommit.sha}`);
          await this.octokit.rest.git.updateRef({
            owner: this.owner,
            repo: this.repo,
            ref: `heads/${mainBranch}`,
            sha: newCommit.sha,
            force: true
          });
        }
        await this.createPullRequestAndReviewAndMerge({
          baseBranch: targetBranch,
          headBranch: `refs/heads/${mainBranch}`,
          issue: issue.number,
          commentTargetFilePath: `${relativePath}/${path__default.default.basename(createdFilePathList[0])}`
          // first file path is used for comment
        });
        console.debug(`delete the source branch. heads/${mainBranch}`);
        await this.octokit.rest.git.deleteRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${mainBranch}`
          // `heads/<branch_name>` or simply `<branch_name>`
        }).catch((error) => {
          console.error(error.message);
        });
        await this.octokit.rest.issues.createComment({
          owner: this.owner,
          repo: this.repo,
          body: faker.faker.lorem.sentences(10),
          issue_number: issue.number
        });
        await promises.rm(path__default.default.join(process.cwd(), relativePath), {
          recursive: true,
          force: true,
          maxRetries: 10
        }).catch((error) => {
          console.error(error.message);
        });
        return issue.number;
      }
      validateIssueTemplate(issues) {
        issues.forEach((issue, index) => {
          if (!issue.title) {
            throw new Error(`[createIssuesFromJson][index: ${index}] Missing field: title`);
          }
          if (!issue.body) {
            throw new Error(`[createIssuesFromJson][index: ${index}] Missing field: body`);
          }
          if (issue.assignee === "") {
            throw new Error(`[createIssuesFromJson][index: ${index}] Invalid field: assignee`);
          }
        });
      }
      async createPullRequestAndReviewAndMerge({
        baseBranch,
        headBranch,
        issue,
        commentTargetFilePath
      }) {
        console.debug(`base branch: refs/heads/${baseBranch}`);
        console.debug(`head branch: ${headBranch}`);
        const { data: pullRequest } = await this.octokit.rest.pulls.create({
          owner: this.owner,
          repo: this.repo,
          base: baseBranch,
          head: headBranch,
          issue,
          body: faker.faker.lorem.paragraphs(10),
          draft: false
        });
        if (!pullRequest) {
          console.error("pull request is not found");
          return;
        }
        const { data: reviewCommented } = await this.octokit.rest.pulls.createReview({
          owner: this.owner,
          repo: this.repo,
          pull_number: pullRequest.number,
          event: "COMMENT",
          comments: [
            {
              path: commentTargetFilePath,
              body: faker.faker.lorem.sentences(3),
              line: 1
            }
          ]
        });
        const reviewerCandidates = await this.octokit.rest.repos.listCollaborators({
          owner: this.owner,
          repo: this.repo,
          permission: "maintain"
        });
        const reviewrs = reviewerCandidates.data.map((user) => user.login).filter((login) => login !== this.owner);
        console.debug(`reviewer candidates: [${reviewrs.join()}]`);
        if (reviewrs.length === 0) {
          console.debug("Review by author is not allowed. No reviewer is assigned.");
        } else {
          await this.octokit.rest.pulls.requestReviewers({
            owner: this.owner,
            repo: this.repo,
            pull_number: pullRequest.number,
            reviewers: [___default.default.sample(reviewrs)]
          });
          await this.octokit.rest.pulls.createReview({
            owner: this.owner,
            repo: this.repo,
            pull_number: pullRequest.number,
            event: "APPROVE",
            comments: [{ path: commentTargetFilePath, body: "LGTM", line: 1 }]
          });
          await this.octokit.rest.pulls.submitReview({
            owner: this.owner,
            repo: this.repo,
            pull_number: pullRequest.number,
            event: "APPROVE",
            review_id: reviewCommented.id
          });
          await this.octokit.rest.pulls.updateReview({
            owner: this.owner,
            repo: this.repo,
            pull_number: pullRequest.number,
            review_id: reviewCommented.id,
            body: "viewed"
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
        const queryResult = await this.octokit.graphql(listPullRequestsAndReviewThreadsQuery, {
          owner: this.owner,
          repo: this.owner,
          pullRequestLast: 100,
          threadLast: 100
        });
        const edges = queryResult.repository.pullRequests.edges;
        console.debug(`pull requests: [${edges.join()}]`);
        const threadIds = edges.map((edge) => edge.node.reviewThreads.edges.map(({ node }) => node)).flat().filter((node) => node && !node.isResolved).map((node) => node.id);
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
              threadId
            }
          });
          console.debug(mutationResult);
        }
        const { data: mergeResult } = await this.octokit.rest.pulls.merge({
          owner: this.owner,
          repo: this.repo,
          pull_number: pullRequest.number,
          merge_method: "squash"
        });
        console.debug(`merged. ${mergeResult.sha} ${mergeResult.message}`);
      }
      createFiles({
        numberOfFiles,
        relativePath,
        language
      }) {
        const directoryPath = path__default.default.join(process.cwd(), relativePath);
        if (!fs.existsSync(directoryPath)) {
          fs.mkdirSync(directoryPath, { recursive: true });
        }
        return Array.from({ length: numberOfFiles }).map(() => {
          try {
            const filePath = path__default.default.join(
              directoryPath,
              `${Date.now().toString()}.${this.languageMap[language].ext}`
            );
            fs.writeFileSync(filePath, faker.faker.lorem.paragraphs(10), {
              encoding: "utf8",
              flag: "a+"
            });
            return filePath;
          } catch (error) {
            console.error(error);
            return "";
          }
        }).filter(Boolean);
      }
    };
  }
});
async function createEnvExample(options) {
  const keySet = /* @__PURE__ */ new Set();
  const output = fs__default.default.readFileSync(path__default.default.join(process.cwd(), options.filename), "utf8").split("\r").join("").split("\n").map((line) => line.trim()).map((line, index) => {
    if (line === "") {
      return "";
    }
    if (line.startsWith("#")) {
      return options.comments ? line : null;
    }
    if (line.indexOf("=") === -1) {
      throw new Error(`Line ${index} does not have a valid config (i.e. no equals sign).`);
    }
    const key = line.split("=")[0];
    if (options.merge && keySet.has(key)) {
      return null;
    } else {
      keySet.add(key);
      return key + "=";
    }
  }).filter((line) => line !== null).join("\n");
  fs__default.default.writeFileSync(path__default.default.join(process.cwd(), ".env.example"), output, {
    encoding: "utf-8",
    flag: "w+"
  });
  console.log("\u2728 .env.example successfully generated.");
}
var init_env_example = __esm({
  "src/libs/env-example.ts"() {
  }
});

// src/libs/index.ts
var init_libs = __esm({
  "src/libs/index.ts"() {
    init_env_example();
  }
});
var require_cli = __commonJS({
  "src/cli.ts"() {
    init_package();
    init_github();
    init_libs();
    var program = new commander.Command().name(name).description(description).version(version);
    program.command("setup").description(
      "It sets up gitarist suite. It will create a new GitHub workflow file and `.env` file, adds environment variables to .env file, and opens a browser to create a new GitHub token."
    ).addOption(new commander.Option("--remote <string>", "the name of remote").default(DEFAULT.remote)).action(async (options) => {
      await Gitarist.setup({ remote: options.remote });
    });
    program.command("start").description(
      "It starts gitarist suite. It simulates an active user on a GitHub repository to create issues, commits, create a pull request, and merge it."
    ).addOption(new commander.Option("-o,--owner <string>", "Repository owner").env("GITHUB_OWNER")).addOption(new commander.Option("-r,--repo <string>", "GitHub repository").env("GITHUB_REPO")).addOption(
      new commander.Option(
        "-t,--token <string>",
        `GitHub access token issued at ${Gitarist.tokenIssueUrl}`
      ).env("GITHUB_TOKEN")
    ).addOption(
      new commander.Option("--max-commits <number>", "Maximum number of commits per PR").default(
        DEFAULT.maxCommits
      )
    ).addOption(
      new commander.Option("--min-commits <number>", "Minimum number of commits per PR").default(
        DEFAULT.minCommits
      )
    ).addOption(
      new commander.Option("--max-files <number>", "Maximum number of files per commit").default(
        DEFAULT.maxFiles
      )
    ).addOption(
      new commander.Option("--min-files <number>", "Minimum number of files per commit").default(
        DEFAULT.minFiles
      )
    ).addOption(
      new commander.Option("--issues <number>", "A number of issues to create").default(DEFAULT.numberOfIssues)
    ).addOption(
      new commander.Option("--working-branch-prefix <string>", "Prefix for working branches").choices(branchPrefixes).default(DEFAULT.workingBranchPrefix)
    ).addOption(new commander.Option("-m,--main-branch <string>", "Main branch").default(DEFAULT.mainBranch)).addOption(
      new commander.Option("--stale <days>", "A number of days before closing an issue").default(DEFAULT.stale)
    ).action(async (options) => {
      [".env"].forEach((file) => {
        dotenv__default.default.config({ path: file });
      });
      options = {
        ...options,
        owner: options.owner ?? process.env.GITHUB_OWNER,
        repo: options.repo ?? process.env.GITHUB_REPO,
        token: options.token ?? process.env.GITHUB_TOKEN
      };
      const validOptions = z__default.default.object({
        owner: z__default.default.string().min(2),
        repo: z__default.default.string().min(1),
        token: z__default.default.string().min(1),
        minCommits: z__default.default.coerce.number().min(1).refine((arg) => arg <= Number(options.maxCommits), {
          message: "minCommits must be less than or equal to maxCommits"
        }),
        maxCommits: z__default.default.coerce.number().min(1),
        minFiles: z__default.default.coerce.number().min(1).refine((arg) => arg <= Number(options.maxFiles), {
          message: "minFiles must be less than or equal to maxFiles"
        }),
        maxFiles: z__default.default.coerce.number().min(1),
        issues: z__default.default.coerce.number().min(1),
        workingBranchPrefix: z__default.default.enum(branchPrefixes),
        mainBranch: z__default.default.string().min(1),
        stale: z__default.default.coerce.number().min(1)
      }).parse(options);
      const gitarist = new Gitarist({
        owner: validOptions.owner,
        repo: validOptions.repo,
        token: validOptions.token
      });
      await gitarist.simulateActiveUser({
        mainBranch: validOptions.mainBranch,
        maxCommits: validOptions.maxCommits,
        maxFiles: validOptions.maxFiles,
        minCommits: validOptions.minCommits,
        minFiles: validOptions.minFiles,
        numberOfIssues: validOptions.issues,
        workingBranchPrefix: validOptions.workingBranchPrefix,
        stale: validOptions.stale
      });
    });
    program.command("env-example").description("Create an example of .env file based on the current .env file(s)").addOption(
      new commander.Option(
        "-f,--filename <string>",
        "Read given env file such as .env.local, .env.test etc."
      ).default(".env")
    ).addOption(new commander.Option("-c,--comments", "Preserve comments").default(true)).addOption(new commander.Option("-m,--merge", "Merge all env files into one").default(true)).action(async (options) => {
      const validOptions = z__default.default.object({
        comments: z__default.default.boolean(),
        filename: z__default.default.string().min(1).refine((arg) => arg !== ".env.example", {
          message: "filename should not be .env.example"
        }),
        merge: z__default.default.boolean()
      }).parse(options);
      await createEnvExample(validOptions);
    });
    program.parse();
  }
});
var cli = require_cli();

module.exports = cli;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=cli.js.map