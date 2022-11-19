import dotenv from 'dotenv';
import glob from 'fast-glob';
import fs from 'fs';
import { readFile } from 'fs-extra';
import { Octokit } from 'octokit';
import path from 'path';

dotenv.config();

type Workflow = {
  id: number;
  node_id: string;
  name: string;
  path: string;
  state:
    | 'active'
    | 'deleted'
    | 'disabled_fork'
    | 'disabled_inactivity'
    | 'disabled_manually';
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
  deleted_at?: string | undefined;
};

/**
 * Parameters for create a commit
 * @reference https://docs.github.com/en/rest/git/commits#create-a-commit
 * @reference https://octokit.github.io/rest.js/v19/#git-create-tree
 */
type TreeParam = {
  path: string;
  /**
   * 100644 for file (blob)
   * 100755 for executable (blob)
   * 040000 for subdirectory (tree)
   * 160000 for submodule (commit)
   * 120000 for a blob
   */
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha: string;
};

/**
 * click here to create a new token
 * #1. repo token
 * https://github.com/settings/tokens/new?description=github_token_repo&scopes=repo,read:packages,read:org,delete_repo
 * #2. workflow token(workflow control must include permission to repo)
 * https://github.com/settings/tokens/new?description=github_token_workflow&scopes=repo,workflow
 * token options
 * https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
 * links above are classic tokens. new token method (fine grained) is newly released.
 * (currently beta version)
 * https://github.com/settings/personal-access-tokens/new
 * Octokit documents
 * https://octokit.github.io/rest.js/v19
 */
export class Gitt {
  private readonly octokit: Octokit;
  private readonly perPage = 100;

  constructor() {
    const tokenName = 'GIT_GITHUB_REPO_PUSH_TOKEN';
    const auth = process.env[tokenName];
    if (!auth) {
      throw new Error('environment variable is not defined: ' + tokenName);
    }

    this.octokit = new Octokit({ auth });
  }

  createFiles({
    relPath,
    numFiles: length,
  }: {
    relPath: string;
    numFiles: number;
  }) {
    const targetDir = path.join(process.cwd(), relPath);
    fs.mkdirSync(targetDir, { recursive: true });

    const files = Array.from({ length })
      .map(() => {
        try {
          const now = Date.now().toString();
          const content = (now + '\n').repeat(100);
          const filePath = path.join(targetDir, now);
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
  removeStaleFiles = ({
    staleTimeInSeconds,
  }: {
    staleTimeInSeconds: number;
  }) => {
    glob.sync(['*'], { onlyDirectories: true }).forEach((dir) => {
      if (new Date(dir) < new Date(Date.now() - staleTimeInSeconds * 1000)) {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
      }
    });
  };

  /**
   * https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0
   * @param param0
   */
  createCommits = async ({
    repo,
    owner,
    branch,
    numFiles = 10,
    relPath = '.commit',
    staleTimeInSeconds = 86400 * 3,
    numCommits = 1,
  }: {
    repo: string;
    owner: string;
    branch: string;
    numFiles?: number;
    relPath?: string;
    staleTimeInSeconds?: number;
    numCommits?: number;
  }) => {
    for (const _ of Array(numCommits).keys()) {
      try {
        const now = Date.now().toString();
        const iso = new Date().toISOString();

        this.createFiles({ relPath, numFiles });
        this.removeStaleFiles({ staleTimeInSeconds });

        // gets commit's AND its tree's SHA
        const ref = `heads/${branch}`;
        const { data: refData } = await this.octokit.rest.git.getRef({
          owner,
          repo,
          ref,
        });
        const commitSha = refData.object.sha;
        const { data: lastCommit } = await this.octokit.rest.git.getCommit({
          owner,
          repo,
          commit_sha: commitSha,
        });

        const treeSha = lastCommit.tree.sha;
        const filesPaths = glob.sync([relPath + '/*']);
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
          path.relative(relPath, fullPath)
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
      } catch (err) {
        console.error(err);
      } finally {
        const targetDir = path.join(process.cwd(), relPath);
        fs.rmSync(targetDir, { recursive: true, force: true, maxRetries: 10 });
      }
    }
  };

  sum = (a: number, b: number): number => a + b;

  createIssues = async ({
    repo,
    owner,
    numIssues = 1,
  }: {
    repo: string;
    owner: string;
    numIssues?: number;
  }) => {
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
      } catch (err) {
        console.error(err);
      }
    }
  };

  /**
   * close issues
   * Deleting issues are not supported currently
   * https://github.com/octokit/octokit.js/discussions/2343
   * @param
   */
  closeIssues = async ({
    repo,
    owner,
    staleTimeInSeconds = 3 * 86400,
  }: {
    repo: string;
    owner: string;
    staleTimeInSeconds?: number;
  }) => {
    try {
      const issues = await this.octokit.rest.issues.list({
        per_page: this.perPage,
        state: 'open',
      });
      const filtered = issues.data.filter(
        (elem) => elem.repository?.name === repo
      );

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
          } catch (err) {
            console.log(issue.number);
          }
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  listRepositories = async ({
    owner,
    jsonFile = 'repos.json',
  }: {
    owner: string;
    jsonFile: string;
  }) => {
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
  };

  deleteRepos = async ({
    owner,
    jsonFile = 'repos.json',
  }: {
    owner: string;
    jsonFile: string;
  }) => {
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
  };

  findWastedActions = async ({ owner }: { owner: string }) => {
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
  };

  deleteRepoWorkflowLogs = async (owner: string, repo: string) => {
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
    const totalPages = 20;

    for (const wfId of wfIds) {
      const workflow = wfs.find((elem) => elem.id === wfId);
      for await (const page of Array(totalPages).keys()) {
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
          // 'completed', // "completed" | "action_required" | "cancelled" | "failure" | "neutral" | "skipped" | "stale" | "success" | "timed_out" | "in_progress" | "queued" | "requested" | "waiting"
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
                new Date(Date.now() - 21 * 86400 * 1000)) ||
            new Date(elem.created_at) < new Date(Date.now() - 30 * 86400 * 1000)
          ) {
            return true;
          }
          return false;
        });

        const runIds = filtered.map(({ id }) => id);
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
            const deleted =
              await this.octokit.rest.actions.deleteWorkflowRunLogs({
                owner,
                repo,
                run_id: runId,
              });
            console.log(`[${repo}] ${workflow?.name} / ${wfId} / ${runId}`);
          } catch (err: any) {
            console.error(err.message);
          }
          try {
            const deleted = await this.octokit.rest.actions.deleteWorkflowRun({
              owner,
              repo,
              run_id: runId,
            });
            console.log(`[${repo}] ${workflow?.name} / ${wfId} / ${runId}`);
          } catch (err: any) {
            console.error(err.message);
          }
        }

        // for await (const runId of runIds) {
        //   console.log(`[${repo}] ${runId}`);
        //   await Promise.all([
        //     async () => {
        //       try {
        //         const deleted = await this.octokit.rest.actions.deleteWorkflowRunLogs({
        //           owner,
        //           repo,
        //           run_id: runId,
        //         });
        //         console.log(`[${repo}] ${workflow?.name} / ${wfId} / ${runId}`);
        //       } catch (err: any) {
        //         console.error(err.message);
        //       }
        //     },
        //     async () => {
        //       try {
        //         const deleted = await this.octokit.rest.actions.deleteWorkflowRun({
        //           owner,
        //           repo,
        //           run_id: runId,
        //         });
        //         console.log(`[${repo}] ${workflow?.name} / ${wfId} / ${runId}`);
        //       } catch (err: any) {
        //         console.error(err.message);
        //       }
        //     },
        //   ]);
        // }

        if (runResponse.data.total_count === 0) {
          break;
        }
      }
    }
  };
}
