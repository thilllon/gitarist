// import { Injectable } from '@nestjs/common';
// import * as fs from 'fs';
// import { OctokitService } from 'nestjs-octokit';
// import { Octokit } from 'octokit';
// import * as path from 'path';
// import { Run } from './github.type';
// import { path as rootDir } from 'app-root-path';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class GithubService {
//   BIG_ENOUGH = 9999;
//   MAX_PER_PAGE = 100;
//   ARTIFACT_DESTINATION = 'artifacts';

//   octokit: Octokit;

//   constructor(
//     private readonly configService: ConfigService,
//     private readonly octokitService: OctokitService,
//   ) {
//     /**
//      * https://this.octokitService.github.io/rest.js/v18/
//      */
//     const auth = this.configService.get('GITHUB_REPO_TOKEN') ?? process.env.GITHUB_REPO_TOKEN;
//     this.octokit = new Octokit({ auth });
//   }

//   /**
//    * list repos
//    * @param auth
//    * @param owner
//    * @param jsonFile
//    * @returns
//    */
//   async listRepos(auth: string, owner: string, jsonFile = 'repos.json') {
//     const repoNames: string[] = [];
//     const perPage = 100;
//     let iter = 0;

//     while (true) {
//       console.log('fetching repos...');

//       const octokit = this.getOctokit(auth);
//       const { data, status } = await octokit.rest.repos.listForAuthenticatedUser({
//         username: owner,
//         per_page: perPage,
//         page: iter++,
//         type: 'all',
//       });
//       console.log('status', status);
//       const repos = data.map((repo) => repo.name);
//       repoNames.push(...repos);
//       if (repos.length === 0) {
//         break;
//       }
//     }

//     fs.writeFileSync(path.join(process.cwd(), jsonFile), JSON.stringify(repoNames), 'utf8');

//     return repoNames;
//   }

//   /**
//    * delete repos
//    * @param runs
//    * @param owner
//    */
//   async deleteRepoFromJson(auth: string, owner: string, repos?: string[], jsonFile = 'repos.json') {
//     const octokit = this.getOctokit(auth);
//     repos = repos ?? JSON.parse(fs.readFileSync(path.join(process.cwd(), jsonFile), 'utf8'));
//     const deleted = [];

//     for (const repo of repos) {
//       try {
//         const res = await octokit.rest.repos.delete({ owner, repo });
//         console.log(`deleted ${repo}`);
//         deleted.push(repo);
//       } catch (error) {
//         console.log(`error deleting ${repo}`);
//       }
//     }
//     fs.writeFileSync(path.join(process.cwd(), 'deleted.json'), JSON.stringify(deleted), 'utf8');
//   }

//   // async getWorkflows(owner: string, repo: string, token?: string) {
//   //   const oct = token ? this.getOctokit(token) : this.octokitService;
//   //   const res = await oct.rest.actions.listRepoWorkflows({ owner, repo });
//   //   return res.data;
//   // }

//   // async getWorkflowRuns(owner: string, repo: string, workflowId: string) {
//   //   // const octokit = await this.getOctokit();
//   //   // const res = await this.octokitService.rest.actions.listWorkflowRuns({
//   //   //   owner,
//   //   //   repo,
//   //   //   workflow_id: workflowId,
//   //   // });
//   //   // return res.data;
//   // }

//   async deleteWorkflowRun(runs: Run[], owner: string) {
//     for await (const run of runs) {
//       const repo = run.repository.name;
//       const run_id = run.id;
//       const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${run_id}`;

//       try {
//         const deleteResponse = await this.octokitService.rest.actions.deleteWorkflowRun({
//           owner,
//           repo,
//           run_id,
//         });
//         console.log('삭제 결과', deleteResponse.status, runUrl);
//       } catch (err: any) {
//         console.error('삭제 실패', err.response ? err.response.status : err, runUrl);
//       }
//     }
//   }

//   /**
//    * read run logs in JSON file and delete those
//    * @param owner
//    */
//   async deleteWorkflowRunHistory(owner: string) {
//     const folder = path.join(rootDir, this.ARTIFACT_DESTINATION);
//     const runLogs = fs.readdirSync(folder);

//     for await (const runLog of runLogs) {
//       console.group(runLog);

//       const data = fs.readFileSync(path.join(folder, runLog), 'utf-8');
//       const runs = JSON.parse(data);

//       const staleRunList = await this.getStaleWorkflowRuns(runs, {
//         exceptRecent: 10,
//         ignoreBranches: ['master', 'dev', 'main'],
//       });
//       await this.deleteWorkflowRun(staleRunList, owner);

//       console.groupEnd();
//     }
//   }

//   /**
//    * get stale, error, failed workflow runs. (older than `exceptRecent` runs)
//    * @example getStaleWorkflowRuns(runList, 10) means getting from recent 11st to last
//    * @param runs
//    * @param exceptRecent
//    * @returns
//    */
//   async getStaleWorkflowRuns(
//     runs: Run[],
//     { exceptRecent, ignoreBranches }: { exceptRecent: number; ignoreBranches: string[] },
//   ) {
//     type WorkflowId = number;

//     // TODO: 동작중인 workflow 제외하기
//     runs = runs.filter((run) => {
//       const flag = run.conclusion !== 'success' || !ignoreBranches.includes(run.head_branch);
//       return flag;
//     });

//     const runObj: Record<WorkflowId, Run[]> = runs.reduce((obj, elem) => {
//       const wfs = obj[elem.workflow_id] || [];
//       obj[elem.workflow_id] = [...wfs, elem];
//       return obj;
//     }, {} as { [key: WorkflowId]: Run[] });

//     const targetRunList = Object.entries(runObj)
//       .map(([_, workflowRunList]) => {
//         // descending order by created_at
//         const sorted = workflowRunList.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
//         return sorted.slice(exceptRecent, sorted.length);
//       })
//       .flat();
//     return targetRunList;
//   }

//   /**
//    *
//    * 실패한 워크플로우 목록 가져오기
//    * @param runList
//    * @param ignoreBranches
//    * @returns
//    */
//   async getFailedRuns(runList: Run[], ignoreBranches: string[] = ['master', 'main', 'dev']) {
//     const filteredRunList = runList.filter((run) => {
//       const flag =
//         run.status !== 'completed' ||
//         run.conclusion !== 'success' ||
//         !ignoreBranches.includes(run.head_branch);
//       return flag;
//     });
//     return filteredRunList;
//   }

//   /**
//    *
//    * @param owner
//    * @param repo
//    * TODO: listWorkflowRunsForRepo vs listRepoWorkflows 차이?
//    */
//   async saveListWorkflowRunsForRepo(org: string, owner: string) {
//     const { data: repos } = await this.octokitService.rest.repos.listForOrg({
//       org,
//       type: 'private',
//     });

//     for await (const repo of repos) {
//       const runs: Run[] = [];

//       // FIXME: 실험중
//       // 얘는 왼쪽 All workflows 에 있는 워크플로 런 히스토리 지우는것.
//       // 왼쪽에 살아있는 workflow 뿐만 아니라 사라진애 workflow 의 기록까지 다 들고있음
//       for (let page = 0; page < this.BIG_ENOUGH; page++) {
//         const response = await this.octokitService.rest.actions.listWorkflowRunsForRepo({
//           owner,
//           repo: repo.name,
//           per_page: this.MAX_PER_PAGE,
//           page,
//         });
//         const runsChunk = response.data.workflow_runs;
//         runs.push(...(runsChunk as Run[]));

//         console.log('# runs:', runsChunk.length);

//         if (runsChunk.length === 0) {
//           break;
//         }
//       }

//       // const response = await this.octokitService.rest.actions.listRepoWorkflows({
//       //   owner,
//       //   repo: repo.name,
//       //   page: 0,
//       //   per_page: this.MAX_PER_PAGE,
//       // });
//       // const workflows = response.data.workflows;

//       // for await (const workflow of workflows) {
//       // console.group(repo.name, workflow.name, workflow.id);
//       //   for (let page = 0; page < 9999; page++) {
//       //     const res = await this.octokitService.rest.actions.listWorkflowRuns({
//       //       owner,
//       //       repo: repo.name,
//       //       workflow_id: workflow.id,
//       //       per_page: this.MAX_PER_PAGE,
//       //       page,
//       //     });
//       //     const {
//       //       data: { workflow_runs: runs },
//       //     } = res;
//       //     console.log(runs.length);
//       //     runList.push(...runs);
//       //     if (runs.length === 0) {
//       //       break;
//       //     }
//       //   }
//       //   console.groupEnd();
//       // }

//       if (runs.length > 0) {
//         fs.mkdirSync(path.join(rootDir, this.ARTIFACT_DESTINATION), { recursive: true });

//         fs.writeFileSync(
//           path.join(rootDir, this.ARTIFACT_DESTINATION, `${repo.name}.json`),
//           JSON.stringify(runs),
//           'utf-8',
//         );
//       }
//     }
//   }

//   /**
//    *
//    * 레포에 있는 모든 이슈를 조회하고, 이슈 제목을 변경 후 라벨 추가
//    * @param repo
//    * @param org
//    * @param owner
//    */
//   async changeIssueTitleAndAddLabels(repo: string, org = 'CarillonDev', owner = 'CarillonDev') {
//     const arr = [...Array(this.BIG_ENOUGH).keys()];

//     for await (const page of arr) {
//       const res = await this.octokitService.rest.issues.listForRepo({
//         owner,
//         repo,
//         per_page: this.MAX_PER_PAGE,
//         page,
//       });
//       const issues = res.data;
//       console.log('# issues:', issues.length);
//       if (issues.length === 0) {
//         break;
//       }

//       for (const issue of issues) {
//         const { title, number: issue_number } = issue;
//         let newTitle = '';
//         let labels: string[] = [];
//         if (/^<client>/gi.test(title)) {
//           newTitle = title.replace(/^<client>/gi, '').trim();
//           labels = ['client'];
//         } else if (/^<server>/gi.test(title)) {
//           newTitle = title.replace(/^<server>/gi, '').trim();
//           labels = ['server'];
//         } else if (/^<infra>/gi.test(title)) {
//           newTitle = title.replace(/^<infra>/gi, '').trim();
//           labels = ['infra'];
//         } else {
//           continue;
//         }

//         try {
//           const updateResponse = await this.octokitService.rest.issues.update({
//             owner,
//             repo,
//             issue_number,
//             title: newTitle,
//           });
//           const addLabelResponse = await this.octokitService.rest.issues.addLabels({
//             owner,
//             repo,
//             issue_number,
//             labels,
//           });
//           console.log('issue:', issue_number, '/', updateResponse.status, addLabelResponse.status);
//         } catch (err) {
//           console.error(err);
//         }
//       }
//     }
//   }
// }

export {};
