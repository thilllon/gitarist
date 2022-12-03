/* eslint-disable @typescript-eslint/no-namespace */
import glob from 'fast-glob';
import fs from 'fs';
import { readFile } from 'fs-extra';
import { Octokit } from 'octokit';
import { createPullRequest } from 'octokit-plugin-create-pull-request';
import path from 'path';
import {
  CloseIssuesOptions,
  CreateCommitsOptions,
  CreateFilesOptions,
  CreateIssuesOptions,
  CreatePullRequestOptions,
  DeleteReposOptions,
  DeleteRepoWorkflowLogsOptions,
  FindWastedActionsOptions,
  ListRepositoriesOptions,
  RemoveStaleFilesOptions,
  TreeParam,
  Workflow,
} from './Gitt.interface';

/**
 * click here to create a new token
 *
 * #1. repo token
 * https://github.com/settings/tokens/new?description=github_token_repo&scopes=repo,read:packages,read:org,delete_repo
 *
 * #2. workflow token(workflow control must include permission to repo)
 * https://github.com/settings/tokens/new?description=github_token_workflow&scopes=repo,workflow
 * token options
 *
 * https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
 *
 * links above are classic tokens. new token method (fine grained) is newly released. (currently beta version)
 * https://github.com/settings/personal-access-tokens/new
 *
 * Octokit documents
 * https://octokit.github.io/rest.js/v19
 */
export class Gitt {
  private readonly octokit;
  private readonly perPage = 100;
  private readonly _owner?: string;
  private readonly _repo?: string;

  constructor({ token }: { token?: string } = {}) {
    let auth = token;
    if (!auth) {
      const TOKEN_NAME = 'GITT_TOKEN';
      auth = process.env[TOKEN_NAME];
      if (!auth) {
        throw new Error('environment variable is not defined: ' + TOKEN_NAME);
      }
    }

    const _Octokit = Octokit.plugin(createPullRequest);
    this.octokit = new _Octokit({ auth });

    this._owner = process.env.GITT_OWNER;
    this._repo = process.env.GITT_REPO;
  }

  get owner() {
    return this._owner;
  }

  get repo() {
    return this._repo;
  }

  sum(a: number, b: number) {
    return a + b;
  }

  createFiles({ dirName, numFiles }: CreateFilesOptions) {
    const targetDir = path.join(process.cwd(), dirName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    console.log(targetDir);

    const files = Array.from({ length: numFiles })
      .map(() => {
        try {
          const now = Date.now().toString();
          const content = (now + '\n').repeat(100);
          const filePath = path.join(targetDir, now);

          console.log(filePath);

          fs.writeFileSync(filePath, content, 'utf8');
          return filePath;
        } catch (err) {
          console.log(err);
        }
      })
      .filter((file): file is string => !!file);

    return files;
  }

  async getFileAsUTF8(filePath: string) {
    return readFile(filePath, 'utf8');
  }

  /**
   * 현재 프로젝트에서 일정 기간이 지난 파일을 삭제하는 함수
   * 파일의 실제 생성시간을 확인하는 것이 아니라 폴더이름을 바탕으로 삭제한다.
   * @param staleTimeInSeconds 파일이 생성된 후 몇 초가 지난 파일에 대해 삭제할 것인지
   */
  removeStaleFiles({
    staleTimeInSeconds,
    searchingPaths,
  }: RemoveStaleFilesOptions) {
    console.log('[remove stale files]');

    searchingPaths = searchingPaths ?? ['__commit'];

    glob.sync(searchingPaths, { onlyDirectories: false }).forEach((name) => {
      if (isNaN(parseInt(name))) {
        return;
      }

      console.log(name);

      if (
        new Date(parseInt(name)) <
        new Date(Date.now() - staleTimeInSeconds * 1000)
      ) {
        fs.rmSync(name, { recursive: true, force: true, maxRetries: 10 });
      }
    });
  }

  /**
   * https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0
   * @param param0
   */
  async createCommits({
    owner,
    repo,
    branch,
    numFiles = 10,
    dirName,
    numCommits = 1,
    removeOptions,
  }: CreateCommitsOptions) {
    for (const _ of Array(numCommits).keys()) {
      try {
        const now = Date.now().toString();
        const iso = new Date().toISOString();

        this.createFiles({ dirName, numFiles });
        this.removeStaleFiles(removeOptions);

        // gets commit's AND its tree's SHA
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
        const filesPaths = glob.sync([dirName + '/*']);
        const filesBlobs = await Promise.all(
          filesPaths.map(async (filePath) => {
            const content = await this.getFileAsUTF8(filePath);
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
        const pathsForBlobs = filesPaths.map((fullPath) =>
          path.relative(dirName, fullPath)
        );

        const tree: TreeParam[] = filesBlobs.map(({ sha }, index) => ({
          path: now + '/' + pathsForBlobs[index],
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
        console.error(err.message);
      } finally {
        const targetDir = path.join(process.cwd(), dirName);
        // fs.rmSync(targetDir, { recursive: true, force: true, maxRetries: 10 });
      }
    }
  }

  async createIssues({ owner, repo, numIssues = 1 }: CreateIssuesOptions) {
    for (const _ of Array(numIssues).keys()) {
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
        console.error(err.message);
      }
    }
  }

  /**
   * close issues
   * Deleting issues are not supported currently
   * https://github.com/octokit/octokit.js/discussions/2343
   * @param repo string
   * @param owner string
   * @param staleTimeInSeconds number
   */
  async closeIssues({ owner, repo, staleTimeInSeconds }: CloseIssuesOptions) {
    // FIXME: rxjs 로 변경

    try {
      const issues = await this.octokit.rest.issues.list({
        owned: true,
        per_page: this.perPage,
        state: 'open',
        filter: 'created',
      });

      const filtered = issues.data.filter(
        ({ repository }) => repository?.name === repo
      );

      // console.log(filtered);

      await Promise.all(
        filtered.map(async (issue) => {
          try {
            if (
              issue.created_at &&
              new Date(issue.created_at) <
                new Date(Date.now() - staleTimeInSeconds * 1000)
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
      console.error(err.message);
    }
  }

  async listRepositories({
    owner,
    jsonFile = 'repos.json',
  }: ListRepositoriesOptions) {
    const total: string[] = [];
    let iter = 0;

    while (true) {
      console.log('fetching repos...');
      const { data, status } =
        await this.octokit.rest.repos.listForAuthenticatedUser({
          username: owner,
          per_page: this.perPage,
          page: iter++,
          type: 'all',
        });
      console.log('status', status);
      const repos = data.map((repo) => repo.name);
      total.push(...repos);

      if (repos.length === 0) {
        break;
      }
    }

    fs.writeFileSync(
      path.join(process.cwd(), jsonFile),
      JSON.stringify(total),
      'utf8'
    );
  }

  async deleteRepos({ owner, jsonFile = 'repos.json' }: DeleteReposOptions) {
    const repos: string[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), jsonFile), 'utf8')
    );
    const deleted: string[] = [];

    for (const repo of repos) {
      try {
        const res = await this.octokit.rest.repos.delete({ owner, repo });
        // console.log(res);
        console.log(`deleted ${repo}`);
        deleted.push(repo);
      } catch (error) {
        console.log(`error deleting ${repo}`);
      }
    }

    fs.writeFileSync(
      path.join(process.cwd(), 'deleted.json'),
      JSON.stringify(deleted),
      'utf8'
    );
  }

  /**
   * 낭비되고 있는 github action을 감지한다.
   * @param
   */
  async findWastedActions({ owner }: FindWastedActionsOptions) {
    const res = await this.octokit.rest.repos.listForAuthenticatedUser({
      username: owner,
      per_page: this.perPage,
    });

    console.log('Number of repositories:', res.data.length);

    // res.data.map((elem) => {
    //   // console.log(elem.name);
    // });

    // this.octokit.rest.actions.deleteWorkflowRun({ owner, repo, run_id });
    // this.octokit.rest.actions.deleteWorkflowRunLogs({ owner, repo, run_id });
    // this.octokit.rest.actions.getWorkflow({ owner, repo, workflow_id });

    for await (const repoResponse of this.octokit.paginate.iterator(
      this.octokit.rest.repos.listForAuthenticatedUser,
      { username: owner, per_page: this.perPage }
    )) {
      const repos = repoResponse.data.map((elem) => elem.name);
      for (const repo of repos) {
        try {
          for await (const wfResponse of this.octokit.paginate.iterator(
            this.octokit.rest.actions.listRepoWorkflows,
            { owner, repo, per_page: this.perPage }
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
    staleTimeInSeconds,
  }: DeleteRepoWorkflowLogsOptions) {
    let wfIds: number[] = [];
    const wfs: Workflow[] = [];
    for await (const page of Array(200).keys()) {
      const wfResponse = await this.octokit.rest.actions.listRepoWorkflows({
        owner,
        repo,
        per_page: this.perPage,
        page,
      });
      console.log(wfResponse.data.total_count);

      wfs.push(...wfResponse.data.workflows);
      const ids = wfResponse.data.workflows.map((elem) => elem.id);
      if (ids.length) {
        // console.log(ids);
      }

      wfIds.push(...ids);

      if (
        wfResponse.data.total_count === 0 ||
        wfResponse.data.workflows.length === 0
      ) {
        break;
      }
    }

    wfIds = [...new Set(wfIds)];

    console.log('workflow Ids', wfIds);

    const maxTotalPages = 20;

    for (const wfId of wfIds) {
      const workflow = wfs.find((elem) => elem.id === wfId);
      for await (const page of Array(maxTotalPages).keys()) {
        const runResponse =
          await this.octokit.rest.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            workflow_id: wfId,
            per_page: this.perPage,
            page,
          });

        // console.log(runResponse);

        const filtered = runResponse.data.workflow_runs.filter((elem) => {
          // TODO: filtering logic
          // "completed"
          // "action_required"
          // "cancelled"
          // "failure"
          // "neutral"
          // "skipped"
          // "stale"
          // "success"
          // "timed_out"
          // "in_progress"
          // "queued"
          // "requested"
          // "waiting"

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
              new Date(elem.created_at) <
                new Date(Date.now() - staleTimeInSeconds * 1000)) ||
            new Date(elem.created_at) <
              new Date(Date.now() - staleTimeInSeconds * 1000)
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
            console.error(err.message);
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
            console.error(err.message);
          }
        }

        if (runResponse.data.total_count === 0) {
          break;
        }
      }
    }
  }

  // https://www.npmjs.com/package/octokit-plugin-create-pull-request
  async createPullRequest({
    owner,
    repo,
    dirName: dir,
  }: CreatePullRequestOptions) {
    const now = Date.now().toString();
    const iso = new Date().toISOString();

    this.octokit
      .createPullRequest({
        owner,
        repo,
        title: now,
        body: now,
        head: 'feat/' + now,
        update: false,
        forceFork: false,
        changes: [
          {
            /* optional: if `files` is not passed, an empty commit is created instead */
            files: {
              [dir + '/' + now]: now,
              // 'path/to/file2.png': {
              //   content: '_base64_encoded_content_',
              //   encoding: 'base64',
              // },
              // // deletes file if it exists,
              // 'path/to/file3.txt': null,
              // // updates file based on current content
              // 'path/to/file4.txt': ({ exists, encoding, content }: anyTemp) => {
              //   // do not create the file if it does not exist
              //   if (!exists) {
              //     return null;
              //   }
              //   return Buffer.from(content, encoding)
              //     .toString('utf-8')
              //     .toUpperCase();
              // },
              // 'path/to/file5.sh': {
              //   content: 'echo Hello World',
              //   encoding: 'utf-8',
              //   // one of the modes supported by the git tree object
              //   // https://developer.github.com/v3/git/trees/#tree-object
              //   mode: '100755',
              // },
            },
            commit: iso + ' pr',
          },
        ],
      })
      .then((pr) => {
        if (pr) {
          console.log(pr.data.number);
        }
      });
  }

  async removeIssueCommentsByBot({
    owner,
    repo,
  }: {
    owner: string;
    repo: string;
  }) {
    const arr = [...Array(9999).keys()];

    for await (const page of arr) {
      const commentsResponse =
        await this.octokit.rest.issues.listCommentsForRepo({
          owner,
          repo,
          per_page: this.perPage,
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

  async saveRepoList() {
    //
  }
}
