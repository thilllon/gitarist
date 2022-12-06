// /**
//  * read run logs in JSON file and delete those
//  * @param owner
//  */
// async deleteWorkflowRunHistory(owner: string) {
//   const folder = path.join(rootDir, this.ARTIFACT_DESTINATION);
//   const runLogs = fs.readdirSync(folder);

//   for await (const runLog of runLogs) {
//     console.group(runLog);

//     const data = fs.readFileSync(path.join(folder, runLog), 'utf-8');
//     const runs = JSON.parse(data);

//     const staleRunList = await this.getStaleWorkflowRuns(runs, {
//       exceptRecent: 10,
//       ignoreBranches: ['master', 'dev', 'main'],
//     });
//     await this.deleteWorkflowRun(staleRunList, owner);

//     console.groupEnd();
//   }
// }

// /**
//  * get stale, error, failed workflow runs. (older than `exceptRecent` runs)
//  * @example getStaleWorkflowRuns(runList, 10) means getting from recent 11st to last
//  * @param runs
//  * @param exceptRecent
//  * @returns
//  */
// async getStaleWorkflowRuns(
//   runs: Run[],
//   {
//     exceptRecent,
//     ignoreBranches,
//   }: { exceptRecent: number; ignoreBranches: string[] }
// ) {
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
// }

// /**
//  *
//  * @param owner
//  * @param repo
//  * TODO: listWorkflowRunsForRepo vs listRepoWorkflows 차이?
//  */
// async saveListWorkflowRunsForRepo(org: string, owner: string) {
//   const { data: repos } = await this.octokitService.rest.repos.listForOrg({
//     org,
//     type: 'private',
//   });

//   for await (const repo of repos) {
//     const runs: Run[] = [];

//     // FIXME: 실험중
//     // 얘는 왼쪽 All workflows 에 있는 워크플로 런 히스토리 지우는것.
//     // 왼쪽에 살아있는 workflow 뿐만 아니라 사라진애 workflow 의 기록까지 다 들고있음
//     for (let page = 0; page < this.BIG_ENOUGH; page++) {
//       const response =
//         await this.octokitService.rest.actions.listWorkflowRunsForRepo({
//           owner,
//           repo: repo.name,
//           per_page: this.MAX_PER_PAGE,
//           page,
//         });
//       const runsChunk = response.data.workflow_runs;
//       runs.push(...(runsChunk as Run[]));

//       console.log('# runs:', runsChunk.length);

//       if (runsChunk.length === 0) {
//         break;
//       }
//     }

//     // const response = await this.octokitService.rest.actions.listRepoWorkflows({
//     //   owner,
//     //   repo: repo.name,
//     //   page: 0,
//     //   per_page: this.MAX_PER_PAGE,
//     // });
//     // const workflows = response.data.workflows;

//     // for await (const workflow of workflows) {
//     // console.group(repo.name, workflow.name, workflow.id);
//     //   for (let page = 0; page < 9999; page++) {
//     //     const res = await this.octokitService.rest.actions.listWorkflowRuns({
//     //       owner,
//     //       repo: repo.name,
//     //       workflow_id: workflow.id,
//     //       per_page: this.MAX_PER_PAGE,
//     //       page,
//     //     });
//     //     const {
//     //       data: { workflow_runs: runs },
//     //     } = res;
//     //     console.log(runs.length);
//     //     runList.push(...runs);
//     //     if (runs.length === 0) {
//     //       break;
//     //     }
//     //   }
//     //   console.groupEnd();
//     // }

//     if (runs.length > 0) {
//       fs.mkdirSync(path.join(rootDir, this.ARTIFACT_DESTINATION), {
//         recursive: true,
//       });

//       fs.writeFileSync(
//         path.join(rootDir, this.ARTIFACT_DESTINATION, `${repo.name}.json`),
//         JSON.stringify(runs),
//         'utf-8'
//       );
//     }
//   }
// }

export {};
