import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Octokit } from 'octokit';
import * as path from 'path';

dotenv.config();

type WorkflowType = {
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

// click here to create a new token
// #1. repo token
// https://github.com/settings/tokens/new?description=github_token_repo&scopes=repo,read:packages,read:org,delete_repo

// #2. workflow token(workflow control must include permission to repo)
// https://github.com/settings/tokens/new?description=github_token_workflow&scopes=repo,workflow

// token options
// https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps

// links above are classic tokens. new token method (fine grained) is newly released.
// (currently beta version)
// https://github.com/settings/personal-access-tokens/new

// Octokit documents
// https://octokit.github.io/rest.js/v19

if (!process.env.GITHUB_REPO_TOKEN) {
  throw new Error();
}

const perPage = 100;

const auth = process.env.GITHUB_REPO_TOKEN;

const octokit = new Octokit({ auth });

export const listRepositories = async ({
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
    const { data, status } = await octokit.rest.repos.listForAuthenticatedUser({
      username: owner,
      per_page: perPage,
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

export const deleteRepos = async ({
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
      const res = await octokit.rest.repos.delete({ owner, repo });
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

export const findWastedActions = async ({ owner }: { owner: string }) => {
  const res = await octokit.rest.repos.listForAuthenticatedUser({
    username: owner,
    per_page: perPage,
  });

  console.log('Number of repositories:', res.data.length);

  // res.data.map((elem) => {
  //   // console.log(elem.name);
  // });

  // octokit.rest.actions.deleteWorkflowRun({ owner, repo, run_id });
  // octokit.rest.actions.deleteWorkflowRunLogs({ owner, repo, run_id });
  // octokit.rest.actions.getWorkflow({ owner, repo, workflow_id });

  for await (const repoResponse of octokit.paginate.iterator(
    octokit.rest.repos.listForAuthenticatedUser,
    { username: owner, per_page: perPage }
  )) {
    const repos = repoResponse.data.map((elem) => elem.name);
    for (const repo of repos) {
      try {
        for await (const wfResponse of octokit.paginate.iterator(
          octokit.rest.actions.listRepoWorkflows,
          { owner, repo, per_page: perPage }
        )) {
          const wfs = wfResponse.data;
          for (const wf of wfs) {
            const usages = await octokit.rest.actions.getWorkflowUsage({
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

export const deleteRepoWorkflowLogs = async (owner: string, repo: string) => {
  let wfIds: number[] = [];
  const wfs: WorkflowType[] = [];
  for await (const page of Array(200).keys()) {
    const wfResponse = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
      per_page: perPage,
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
      const runResponse = await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        workflow_id: wfId,
        per_page: perPage,
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
      //         return octokit.rest.actions.deleteWorkflowRunLogs({ owner, repo, run_id: id });
      //       })
      //     );
      //   })
      // );

      for await (const runId of runIds) {
        console.log(`[${repo}] ${runId}`);
        try {
          const deleted = await octokit.rest.actions.deleteWorkflowRunLogs({
            owner,
            repo,
            run_id: runId,
          });
          console.log(`[${repo}] ${workflow?.name} / ${wfId} / ${runId}`);
        } catch (err: any) {
          console.error(err.message);
        }
        try {
          const deleted = await octokit.rest.actions.deleteWorkflowRun({
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
      //         const deleted = await octokit.rest.actions.deleteWorkflowRunLogs({
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
      //         const deleted = await octokit.rest.actions.deleteWorkflowRun({
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
// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
