import glob from 'fast-glob';
import fs, { existsSync, mkdirSync, statSync } from 'fs';
import { Octokit } from 'octokit';
import { createPullRequest as createPullRequestPlugin } from 'octokit-plugin-create-pull-request';
import path from 'path';
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
  GetRateLimitOptions,
  GetStaleWorkflowRunsOptions,
  Issue,
  ListRepositoriesOptions,
  MimicIssueReportOptions,
  MimicPullRequestOptions,
  RemoveBranchOptions,
  RemoveCommentsOnIssueByBotOptions,
  RemoveStaleFilesOptions,
  TreeParam,
  __Repository,
  __Workflow,
} from './gitarist.interface';

// https://octokit.github.io/rest.js/v19
// https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps

export class Gitarist {
  private readonly octokit;
  private readonly _owner: string;
  private readonly _repo: string;

  constructor({
    owner,
    repo,
    authToken,
  }: {
    owner: string;
    repo: string;
    authToken: string;
  }) {
    this._owner = owner;
    this._repo = repo;

    const _Octokit = Octokit.plugin(createPullRequestPlugin);
    this.octokit = new _Octokit({ auth: authToken });
  }

  get owner() {
    return this._owner;
  }

  get repo() {
    return this._repo;
  }

  getOctokit(): Octokit {
    return this.octokit;
  }

  /**
   * create files to be commited later
   * @param numFiles  number of files to create
   * @param directory relative path from process.cwd()
   * @returns files names
   */
  private createCommitFiles({
    numFiles,
    directory = '.gitarist/.tmp',
    verbose,
  }: CreateFilesOptions) {
    if (verbose) {
      console.group('[create files]');
    }

    const directoryPath = path.join(process.cwd(), directory);

    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }

    const files = Array.from({ length: numFiles })
      .map(() => {
        try {
          const now = Date.now().toString();
          const iso = new Date().toISOString();
          const content = (iso + '\n').repeat(10);
          const filePath = path.join(directoryPath, now);

          if (verbose) {
            console.debug(filePath);
          }

          fs.writeFileSync(filePath, content, 'utf8');
          return filePath;
        } catch (err) {
          console.error(err);
        }
      })
      .filter((file): file is string => !!file);

    if (verbose) {
      console.groupEnd();
    }

    return files;
  }

  /**
   *
   * 현재 프로젝트에서 일정 기간이 지난 파일을 삭제하는 함수
   * 파일의 실제 생성시간을 확인하는 것이 아니라 폴더이름을 바탕으로 삭제한다.
   * @param staleTimeMs 파일이 생성된 후 몇 초가 지난 파일에 대해 삭제할 것인지 The number of milliseconds to determine whether a file is stale or not.
   * @param searchingPaths 삭제할 파일을 찾을 경로. glob pattern을 사용할 수 있다. The paths to find files to delete. A list of relative path to be searched to filter stale files.
   */
  removeStaleFiles({
    staleTimeMs,
    searchingPaths,
    verbose,
  }: RemoveStaleFilesOptions) {
    if (verbose) {
      console.group('[remove stale files]');
    }
    searchingPaths ??= [`./.gitarist/__commit/**`];

    const isStaleEnough = (filePath: string) => {
      const fileName = path.basename(filePath);
      if (statSync(filePath).birthtimeMs < Date.now() - staleTimeMs) {
        if (verbose) {
          console.debug(filePath);
        }
        fs.rmSync(filePath, { recursive: true, force: true, maxRetries: 10 });
        return fileName;
      }

      // NOTE: based on filename
      // const fileName = path.basename(filePath);
      // if (isNaN(parseInt(fileName))) {
      //   return;
      // }

      // if (new Date(parseInt(fileName)) < new Date(Date.now() - staleTimeMs)) {
      //   if (verbose) {
      //     console.debug(filePath);
      //   }

      //   fs.rmSync(filePath, { recursive: true, force: true, maxRetries: 10 });
      //   return fileName;
      // }
    };

    const staleFileNames = glob
      .sync(searchingPaths, { onlyFiles: true })
      .map(isStaleEnough)
      .filter((fileName): fileName is string => !!fileName);

    if (verbose) {
      console.groupEnd();
    }

    return staleFileNames;
  }

  /**
   * https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0
   * @param {string} repo
   * @param {string} owner
   * @param {string} branch
   * @param {NumberOrRange=} numFiles
   * @param {NumberOrRange=} numCommits
   * @param staleTimeMs 파일이 생성된 후 몇 초가 지난 파일에 대해 삭제할 것인지 The number of milliseconds to determine whether a file is stale or not.
   * @param searchingPaths 삭제할 파일을 찾을 경로. glob pattern을 사용할 수 있다. The paths to find files to delete. A list of relative path to be searched to filter stale files.
   * @param subpath subpath under the ".gitarist" directory. e.g., "__pullrequest"
   * @param removeOptions RemoveStaleFilesOptions remove file options
   */
  async createCommits({
    owner,
    repo,
    branch,
    // numFiles = 10,
    // numCommits = 10,
    numFiles = { min: 1, max: 10 },
    numCommits = { min: 1, max: 20 },
    subpath = '__commit',
    // FIXME: use removeOptions value
    removeOptions,
  }: CreateCommitsOptions) {
    const tmpFolder = '.tmp';

    if (typeof numCommits !== 'number') {
      numCommits = Math.floor(
        Math.random() * (numCommits.max - numCommits.min) + numCommits.min
      );
    }

    for (const _ of Array(numCommits).keys()) {
      const iso = new Date().toISOString();

      try {
        if (typeof numFiles !== 'number') {
          numFiles = Math.floor(
            Math.random() * (numFiles.max - numFiles.min) + numFiles.min
          );
        }

        this.createCommitFiles({ numFiles });
        // FIXME: remove stale files. 삭제만 하면안되고 commit에 포함시켜야함.
        // https://stackoverflow.com/questions/72847260/deleting-folder-from-github-using-octokit-rest
        // this.removeStaleFiles(removeOptions);

        // get commit SHA and its tree's SHA
        const ref = `heads/${branch}`;
        const { data: refData } = await this.octokit.rest.git.getRef({
          owner,
          repo,
          ref,
        });

        const { data: lastCommit } = await this.octokit.rest.git.getCommit({
          owner,
          repo,
          commit_sha: refData.object.sha,
        });

        const treeSha = lastCommit.tree.sha;
        const filesPaths = glob.sync([`.gitarist/${tmpFolder}/*`]);
        const filesBlobs = await Promise.all(
          filesPaths.map(async (filePath) => {
            const content = await fs.readFileSync(filePath, 'utf8');
            const encoding = 'utf-8';
            const blobData = await this.octokit.rest.git.createBlob({
              owner,
              repo,
              content,
              encoding,
            });
            return blobData.data;
          })
        );

        const pathsForBlobs = filesPaths.map(
          (fullPath) => `.gitarist/${subpath}/` + path.basename(fullPath)
        );

        const tree: TreeParam[] = filesBlobs.map(({ sha }, index) => ({
          path: pathsForBlobs[index],
          mode: '100644',
          type: 'blob',
          sha,
        }));

        const { data: newTree } = await this.octokit.rest.git.createTree({
          owner,
          repo,
          tree,
          base_tree: treeSha,
        });

        const { data: newCommit } = await this.octokit.rest.git.createCommit({
          owner,
          repo,
          message: iso,
          tree: newTree.sha,
          parents: [refData.object.sha],
        });

        // THE MOST IMPORTANT PART(git push)
        await this.octokit.rest.git.updateRef({
          owner,
          repo,
          ref,
          sha: newCommit.sha,
        });
      } catch (err: any) {
        console.error(err?.message);
      } finally {
        const dir = path.join(process.cwd(), '.gitarist', tmpFolder);
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
      }
    }
  }

  async createIssues({
    owner,
    repo: repo,
    numberOfIssues = 1,
  }: CreateIssuesOptions) {
    for (const _ of Array(numberOfIssues).keys()) {
      try {
        const iso = new Date().toISOString();
        const content = (iso + '\n').repeat(2);
        const created = await this.octokit.rest.issues.create({
          owner,
          repo,
          title: iso,
          body: content,
          assignees: [owner],
        });

        const issueNumber = created.data.number;

        const comment = await this.octokit.rest.issues.createComment({
          owner,
          repo,
          body: content,
          issue_number: issueNumber,
        });
      } catch (err: any) {
        console.error(err?.message);
      }
    }
  }

  /**
   * close issues
   * Deleting issues are not supported currently
   * https://github.com/octokit/octokit.js/discussions/2343
   * @param repo string
   * @param owner string
   * @param staleTimeMs number
   */
  async closeIssues({
    owner,
    repo,
    staleTimeMs,
    perPage = 100,
  }: CloseIssuesOptions) {
    // TODO: convert to rxjs

    try {
      const issues = await this.octokit.rest.issues.list({
        owned: true,
        per_page: perPage,
        state: 'open',
        filter: 'created',
      });

      const filtered = issues.data.filter(
        ({ repository }) => repository?.name === repo
      );

      await Promise.all(
        filtered.map(async (issue) => {
          try {
            if (
              issue.created_at &&
              new Date(issue.created_at) < new Date(Date.now() - staleTimeMs)
            ) {
              await this.octokit.rest.issues.update({
                owner,
                repo,
                issue_number: issue.number,
                state: 'closed',
                state_reason: 'completed',
              });
            }
          } catch (err: any) {
            console.log(issue.number, err.message);
          }
        })
      );
    } catch (err: any) {
      console.error(err?.message);
    }
  }

  /**
   * list repos
   * @param owner
   * @param ownerLogin optional. filter by owner's login name
   * @param repoLogPath path where repo log will be saved which is relative to cwd. example: ./.artifacts/repos.json
   * @param rawLogPath path where raw log will be saved which is relative to cwd. example: ./.artifacts/raw.json
   * @returns __Repository[]
   */
  async listRepositories({
    owner,
    ownerLogin = owner,
    repoLogPath = './.artifacts/repos.json',
    rawLogPath = './.artifacts/raw.json',
    perPage = 100,
  }: ListRepositoriesOptions) {
    // TODO: convert to rxjs
    const bigEnough = 400;

    let rawDataList: __Repository[] = [];
    let iter = 0;

    // const spinner = ora('fetching repos...').start();
    console.group('fetching repos...');

    let total = 0;
    for (let i = 0; i < bigEnough; i++) {
      const { data, status } =
        await this.octokit.rest.repos.listForAuthenticatedUser({
          username: owner,
          per_page: perPage,
          page: iter++,
          type: 'all',
        });
      rawDataList.push(...data);
      total += data.length;
      const text = `status: ${status} / count: ${i + 1} / received data size: ${
        data.length
      } / total: ${total}`;

      // spinner.text = text;
      console.log(text);

      if (data.length === 0) {
        break;
      }
    }

    // spinner.stopAndPersist();
    console.groupEnd();

    if (ownerLogin) {
      rawDataList = rawDataList.filter(
        (repo) => repo.owner.login === ownerLogin
      );
    }

    const repoNameList = [
      ...new Set(rawDataList.map(({ name }) => name)),
    ].sort();

    if (!repoLogPath.startsWith('./')) {
      repoLogPath = './' + repoLogPath;
    }
    if (!rawLogPath.startsWith('./')) {
      rawLogPath = './' + rawLogPath;
    }

    // if directories do not exist, create those recursively
    const reposLogFullPath = path.dirname(
      path.join(process.cwd(), repoLogPath)
    );
    if (!fs.existsSync(reposLogFullPath)) {
      fs.mkdirSync(reposLogFullPath, { recursive: true });
    }
    fs.writeFileSync(
      path.join(process.cwd(), repoLogPath),
      JSON.stringify(repoNameList),
      'utf8'
    );

    const rawLogFullPath = path.dirname(path.join(process.cwd(), rawLogPath));
    if (!fs.existsSync(rawLogFullPath)) {
      fs.mkdirSync(rawLogFullPath, { recursive: true });
    }
    fs.writeFileSync(
      path.join(process.cwd(), rawLogPath),
      JSON.stringify(rawDataList),
      'utf8'
    );

    return repoNameList;
  }

  /**
   * delete repos
   * @param owner
   * @param repos Optional. default: []. Repo list to be deleted which prior to input. If not provided, read from input
   * @param targetPath default: ./.artifacts/toBeDeleted.json, relative to cwd
   * @param deleteLogPath default: ./.artifacts/deleted.json, relative to cwd
   */
  async deleteRepos({
    owner,
    repos,
    targetPath = './.artifacts/toBeDeleted.json',
    deleteLogPath = './.artifacts/deleted.json',
  }: DeleteReposOptions) {
    if (!repos) {
      if (!fs.existsSync(targetPath)) {
        console.log(`file not exist: ${targetPath}`);
        return [];
      }
      const fileData = fs.readFileSync(
        path.join(process.cwd(), targetPath),
        'utf8'
      );
      repos = JSON.parse(fileData) as string[];
    }

    if (!repos) {
      return [];
    }

    console.log('target:' + repos);

    const deleted: string[] = [];

    for (const repo of repos) {
      try {
        const res = await this.octokit.rest.repos.delete({ owner, repo });
        console.log(`[deleted] ${repo}`);
        deleted.push(repo);
      } catch (err: any) {
        console.error(repo, err?.message);
      }
    }

    fs.writeFileSync(
      path.join(process.cwd(), deleteLogPath),
      JSON.stringify(deleted),
      'utf8'
    );

    return deleted;
  }

  /**
   * 낭비되고 있는 github action을 감지한다.
   * @param
   */
  async findWastedActions({ owner, perPage = 100 }: FindWastedActionsOptions) {
    const res = await this.octokit.rest.repos.listForAuthenticatedUser({
      username: owner,
      per_page: perPage,
    });

    console.log('Number of repositories:', res.data.length);

    // res.data.map((elem) => console.log(elem.name));

    // this.octokit.rest.actions.deleteWorkflowRun({ owner, repo, run_id });
    // this.octokit.rest.actions.deleteWorkflowRunLogs({ owner, repo, run_id });
    // this.octokit.rest.actions.getWorkflow({ owner, repo, workflow_id });

    for await (const repoResponse of this.octokit.paginate.iterator(
      this.octokit.rest.repos.listForAuthenticatedUser,
      { username: owner, per_page: perPage }
    )) {
      const repos = repoResponse.data.map((elem) => elem.name);
      for (const repo of repos) {
        try {
          for await (const wfResponse of this.octokit.paginate.iterator(
            this.octokit.rest.actions.listRepoWorkflows,
            { owner, repo, per_page: perPage }
          )) {
            const wfs = wfResponse.data;
            for (const wf of wfs) {
              // Github workflow ID can be found in url.
              // e.g., https://github.com/<owner>/<repo>/actions/workflows/firebase-hosting-merge.yml
              // => "firebase-hosting-merge.yml" is workflow id'

              const usages = await this.octokit.rest.actions.getWorkflowUsage({
                owner,
                repo,
                workflow_id: wf.id,
              });

              if (usages.data.billable.UBUNTU) {
                console.log(`[${repo}] ${wf.name}`);
                console.log(usages.data);
              }
            }
          }
        } catch (err: any) {
          console.error(`[${repo}]`, err.message);
        }
      }
    }
  }

  // https://github.com/<owner>/<repo>/actions/runs/<run_id>
  async deleteRepoWorkflowLogs({
    owner,
    repo,
    staleTimeMs,
    perPage = 100,
  }: DeleteRepoWorkflowLogsOptions) {
    console.group('[deleteRepoWorkflowLogs]');
    const bigEnough = 200;
    const maxTotalPages = 20;

    let wfIds: number[] = [];
    const wfs: __Workflow[] = [];

    // TODO: rxjs
    for await (const page of Array(bigEnough).keys()) {
      const wfResponse = await this.octokit.rest.actions.listRepoWorkflows({
        owner,
        repo,
        per_page: perPage,
        page,
      });

      // console.log('count:', wfResponse.data.total_count);

      wfs.push(...wfResponse.data.workflows);
      const ids = wfResponse.data.workflows.map(({ id }) => id);

      wfIds.push(...ids);

      if (
        wfResponse.data.total_count === 0 ||
        wfResponse.data.workflows.length === 0
      ) {
        break;
      }
    }

    wfIds = [...new Set(wfIds)];

    console.log('workflow Ids:', wfIds);

    for (const wfId of wfIds) {
      const workflow = wfs.find(({ id }) => id === wfId);
      for await (const page of Array(maxTotalPages).keys()) {
        const runResponse =
          await this.octokit.rest.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            workflow_id: wfId,
            per_page: perPage,
            page,
          });

        // console.log(runResponse);

        const filtered = runResponse.data.workflow_runs.filter((elem) => {
          // "completed" | "action_required" | "cancelled" | "failure" | "neutral" | "skipped" | "stale" | "success" | "timed_out" | "in_progress" | "queued" | "requested" | "waiting"

          if (
            elem.status === 'skipped' ||
            elem.status === 'cancelled' ||
            elem.status === 'failure' ||
            elem.status === 'neutral' ||
            elem.status === 'success' ||
            elem.status === 'timed_out' ||
            (elem.status === 'completed' && elem.conclusion === 'skipped') ||
            (elem.status === 'completed' && elem.conclusion === 'cancelled') ||
            (elem.status === 'completed' &&
              new Date(elem.created_at) < new Date(Date.now() - staleTimeMs)) ||
            new Date(elem.created_at) < new Date(Date.now() - staleTimeMs)
          ) {
            return true;
          }
          return false;
        });

        const runIds = filtered.map(({ id }) => id);

        // TODO: rxjs
        // get 5 items from array and call request simultaneously using rxjs
        // and wait for all to finish
        // and retry failed ones

        // const runIdsChunks = chunk(runIds, 5);
        // const runIdsChunks$ = from(runIdsChunks);
        // const runIdsChunksObs$ = runIdsChunks$.pipe(
        //   mergeMap((ids) => {
        //     return forkJoin(
        //       ids.map((id) => {
        //         return this.octokit.rest.actions.deleteWorkflowRunLogs({ owner, repo, run_id: id });
        //       })
        //     );
        //   })
        // );

        for await (const runId of runIds) {
          console.log(`[${repo}] ${runId}`);
          try {
            const deletedRunLogs =
              await this.octokit.rest.actions.deleteWorkflowRunLogs({
                owner,
                repo,
                run_id: runId,
              });
            console.log(
              `[Run Log Deleted][${repo}] ${workflow?.name} / ${wfId} / ${runId}`
            );
          } catch (err: any) {
            console.error(err?.message);
          }
          try {
            const deletedRun =
              await this.octokit.rest.actions.deleteWorkflowRun({
                owner,
                repo,
                run_id: runId,
              });
            console.log(
              `[Run Deleted][${repo}] ${workflow?.name} / ${wfId} / ${runId}`
            );
          } catch (err: any) {
            console.error(err?.message);
          }
        }

        if (runResponse.data.total_count === 0) {
          break;
        }
      }
    }

    console.groupEnd();
  }

  /**
   * https://www.npmjs.com/package/octokit-plugin-create-pull-request
   *
   * @param owner string
   * @param repo string
   * @param head optional string PR branch name. Prior to the "prefixHead" option
   * @param headPrefix optional string prefix for the head branch. ignored if "head" option is provided
   * @param subpath under the ".gitarist" directory. e.g., "__pullrequest"
   * @param subpath optional string
   */

  async createPullRequest({
    owner,
    repo,
    head,
    headPrefix = 'request',
    subpath = '__pullrequest',
  }: CreatePullRequestOptions) {
    console.group('[create pull request]');

    const now = Date.now().toString();
    const iso = new Date().toISOString();
    const content = Array(100).fill(now).join('\n');

    const pullRequest = await this.octokit.createPullRequest({
      owner,
      repo,
      title: now,
      body: now,
      head: head ?? headPrefix + '_' + now,
      update: true,
      forceFork: false,
      changes: [
        {
          commit: '[PR]' + iso,
          /* optional: if `files` is not passed, an empty commit is created instead */
          files: {
            [`.gitarist/${subpath}/${now}`]: content,
            // 'path/to/file2.png': {
            //   content: '_base64_encoded_content_',
            //   encoding: 'base64',
            // },

            // --------------------------------
            // // deletes file if it exists
            // --------------------------------
            // 'path/to/file3.txt': null,

            // --------------------------------
            // // updates file based on current content
            // --------------------------------
            // 'path/to/file4.txt': ({ content, encoding, exists, size }) => {
            //   // do not create the file if it does not exist
            //   if (!exists) {
            //     return null;
            //   }
            //   return Buffer.from(content, encoding)
            //     .toString('utf-8')
            //     .toUpperCase();
            // },
            // --------------------------------
            // --------------------------------
            // 'path/to/file5.sh': {
            //   content: 'echo Hello World',
            //   encoding: 'utf-8',
            //   // one of the modes supported by the git tree object
            //   // https://developer.github.com/v3/git/trees/#tree-object
            //   mode: '100755',
            // },
          },
        },
      ],
    });

    if (pullRequest) {
      console.log('PR #' + pullRequest.data.number);
    }

    console.groupEnd();

    return pullRequest?.data;
  }

  async removeCommentsOnIssueByBot({
    owner,
    repo,
    perPage = 100,
  }: RemoveCommentsOnIssueByBotOptions) {
    // TODO: rxjs
    const bigEnough = 9999;
    const arr = [...Array(bigEnough).keys()];

    for await (const page of arr) {
      const commentsResponse =
        await this.octokit.rest.issues.listCommentsForRepo({
          owner,
          repo,
          per_page: perPage,
          page,
        });
      const comments = commentsResponse.data;
      if (comments.length === 0) {
        break;
      }

      for (const comm of comments) {
        const isBot = comm.user?.login?.includes('[bot]');

        if (isBot) {
          try {
            await this.octokit.rest.issues.deleteComment({
              owner,
              repo,
              comment_id: comm.id,
            });
            console.log('deleted:', comm.id);
          } catch (err) {
            console.error(err);
          }
        }

        // const { title, number: issue_number } = issue;
        // let newTitle = '';
        // let labels: string[] = [];
        // if (/^<client>/gi.test(title)) {
        //   newTitle = title.replace(/^<client>/gi, '').trim();
        //   labels = ['client'];
        // } else if (/^<server>/gi.test(title)) {
        //   newTitle = title.replace(/^<server>/gi, '').trim();
        //   labels = ['server'];
        // } else if (/^<infra>/gi.test(title)) {
        //   newTitle = title.replace(/^<infra>/gi, '').trim();
        //   labels = ['infra'];
        // } else {
        //   continue;
        // }
        // try {
        //   const updateResponse = await this.octokitService.rest.issues.update({ owner, repo, issue_number, title: newTitle });
        //   const addLabelResponse = await this.octokitService.rest.issues.addLabels({ owner, repo, issue_number, labels });
        //   console.log('issue:', issue_number, '/', updateResponse.status, addLabelResponse.status);
        // } catch (err) {
        //   console.error(err);
        // }
      }
    }
  }

  /**
   * Get all issues and change title and add labels. If issue title starts with one of the KEYs of labelMap then, add labels and change title, in other word,s, remove the KEY from the title)
   * @param repo
   * @param org
   * @param owner
   */
  async changeIssueTitleAndAddLabels({
    owner,
    repo,
    perPage = 100,
    removeKeyFromTitle,
    labelMap = {},
  }: ChangeIssueTitleAndAddLabelsOptions) {
    console.log('[change issue title and add labels]');

    const bigEnough = 9999;

    // const labelMap = {
    //   '<client>': ['client'],
    //   '<server>': ['server'],
    //   '<infra>': ['infra'],
    // };

    const result: {
      success: boolean;
      issue: Issue;
      title: string | undefined;
    }[] = [];

    const pages = [...Array(bigEnough).keys()];

    for await (const page of pages) {
      const res = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        per_page: perPage,
        page,
      });

      const issues = res.data;

      console.log(`# issues(page ${page}) ${issues.length}`);

      if (issues.length === 0) {
        break;
      }

      for (const issue of issues) {
        const labels: string[] = Object.entries(labelMap).flatMap(
          ([title, label]) =>
            issue.title.toLowerCase().includes(title) ? label : []
        );

        const newTitle = removeKeyFromTitle
          ? issue.title.trim()
          : issue.title.replace(/<client>|<server>|<infra>/gi, '').trim();

        try {
          let title: string | undefined;

          if (newTitle !== issue.title && removeKeyFromTitle) {
            const updateResponse = await this.octokit.rest.issues.update({
              owner,
              repo,
              issue_number: issue.number,
              title: newTitle,
            });
            title = updateResponse.data.title;
          }

          const addLabelResponse = await this.octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: issue.number,
            labels,
          });

          result.push({ success: true, issue, title });
        } catch (err) {
          console.error(err);
          result.push({ success: false, issue, title: undefined });
        }
      }
    }

    return result;
  }

  /**
   * get stale, error, failed workflow runs. (older than `exceptRecent` runs)
   * @example getStaleWorkflowRuns(runList, 10) means getting from recent 11st to last
   * @param runs
   * @param exceptRecent
   * @returns
   */
  async getStaleWorkflowRuns({
    runs,
    exceptRecent,
    ignoreBranches,
  }: GetStaleWorkflowRunsOptions) {
    // TODO: rxjs
    //   type WorkflowId = number;
    //   // TODO: 동작중인 workflow 제외하기
    //   runs = runs.filter((run) => {
    //     const flag =
    //       run.conclusion !== 'success' ||
    //       !ignoreBranches.includes(run.head_branch);
    //     return flag;
    //   });
    //   const runObj: Record<WorkflowId, Run[]> = runs.reduce((obj, elem) => {
    //     const wfs = obj[elem.workflow_id] || [];
    //     obj[elem.workflow_id] = [...wfs, elem];
    //     return obj;
    //   }, {} as { [key: WorkflowId]: Run[] });
    //   const targetRunList = Object.entries(runObj)
    //     .map(([_, workflowRunList]) => {
    //       // descending order by created_at
    //       const sorted = workflowRunList.sort((a, b) =>
    //         a.created_at < b.created_at ? 1 : -1
    //       );
    //       return sorted.slice(exceptRecent, sorted.length);
    //     })
    //     .flat();
    //   return targetRunList;
  }

  async mimicIssueReport({ owner, repo }: MimicIssueReportOptions) {
    // 1. create issue
    // 2. create comment
    // 3. close issue

    await this.createIssues({
      owner,
      repo,
      numberOfIssues: 3,
    });

    await this.closeIssues({
      owner,
      repo,
      staleTimeMs: 0,
    });
  }

  async mimicPullRequest({
    owner,
    repo,
    subpath = '__pullrequest',
    reviewOptions,
  }: MimicPullRequestOptions) {
    // 1. create PR
    // 2. create review
    // 3. submit review
    // 4. merge PR

    // TODO: reviewer, assignee 설정
    // TODO: 우상단 viewed 체크하는 로직
    // TODO: resolve conversation 로직

    const pr = await this.createPullRequest({ owner, repo });

    if (!pr) {
      return;
    }

    const pullNumber = pr.number;

    const { data: prData } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    const review = await this.octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      event: 'COMMENT',
      comments: [
        {
          path: `.gitarist/${subpath}/${prData.title}`, // FIXME: relative file path
          body: reviewOptions.content ?? 'hello world',
          line: 1,
        },
      ],
    });

    const reviewId = review.data.id;

    const { data: submitData } = await this.octokit.rest.pulls.submitReview({
      owner,
      repo,
      pull_number: pullNumber,
      review_id: reviewId,
      event: 'APPROVE',
    });

    const { data: mergeData } = await this.octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      merge_method: 'rebase',
    });

    return { mergeData, submitData };
  }

  async getRateLimit(options: GetRateLimitOptions) {
    const { data } = await this.octokit.rest.rateLimit.get({
      ...options,
    });
    return data;
  }

  /**
   *
   * @param ref `refs/heads/<branch_name>` or simply `<branch_name>`
   * @returns
   */
  async removeBranch({ owner, repo, ref }: RemoveBranchOptions) {
    const { data } = await this.octokit.rest.git.deleteRef({
      owner,
      repo,
      ref,
    });

    return data;
  }
}
