import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { Octokit } from 'octokit';
import { Gitarist } from './gitarist';

jest.setTimeout(999999999);

describe('gitarist', () => {
  dotenv.config({ path: '.env.test' });

  let gitarist: Gitarist;
  let octokit: Octokit;

  const owner = process.env.GITARIST_OWNER;
  const repo = process.env.GITARIST_REPO;
  const token = process.env.GITARIST_TOKEN;

  beforeAll(async () => {
    gitarist = new Gitarist({ owner, repo, token });
    octokit = new Octokit({ auth: token });
    jest.resetAllMocks();
  });

  it.skip('setup', async () => {
    Gitarist.setup({});

    expect(true).toBeTruthy();
  });

  it('simulate active user', async () => {
    const deleteOldWorkflowLogsSpy = jest.spyOn(
      gitarist,
      'deleteOldWorkflowLogs',
    );
    const deleteOldFilesSpy = jest.spyOn(gitarist, 'deleteOldFiles');

    await gitarist.simulateActiveUser({
      // maxCommits: 3,
      // minCommits: 3,
      // maxFiles: 10,
      // minFiles: 10,
      // mainBranch: 'main',
      // workingBranchPrefix: 'feature',
      // numberOfIssues: 3,
      // stale: 7,
    });

    expect(deleteOldWorkflowLogsSpy).toHaveBeenCalledTimes(1);
    expect(deleteOldFilesSpy).toHaveBeenCalledTimes(1);
  });

  it.skip('findWastedActionsOverAllRepositories', async () => {
    await gitarist.findWastedActionsOverAllRepositories();
  });

  it('deleteFolder', async () => {
    await gitarist.deleteFolder({ folderPaths: [] });
  });

  it('resolve all unresolved review comments', async () => {
    await gitarist.resolveAllReviewComments();

    expect(true).toBeTruthy();
  });

  it('delete old issues', async () => {
    await gitarist.deleteOldIssues({
      olderThan: new Date('2023-12-06'),
    });

    expect(true).toBeTruthy();
  });

  it.skip('deleteOldFilesAndCommit', async () => {
    await gitarist.deleteOldFiles({
      olderThan: new Date(Date.now() - 28 * 86400 * 1000),
      mainBranch: 'main',
    });

    expect(true).toBeTruthy();
  });

  it.skip('listBranches', async () => {
    const branches = await gitarist.listBranches({
      ref: 'heads/ISSUE-',
    });

    expect(Array.isArray(branches)).toBeTruthy();
  });

  it.skip('deleteBranches', async () => {
    await gitarist.deleteBranches({
      ref: 'heads/bug-',
    });

    expect(true).toBeTruthy();
  });

  it.skip('changePullRequestData', async () => {
    await gitarist.changePullRequestData();
  });

  it.skip('delete deployments', async () => {
    for await (const response of octokit.paginate.iterator(
      octokit.rest.repos.listDeployments,
      { owner, repo },
    )) {
      for (const item of response.data) {
        try {
          await octokit.rest.repos.deleteDeployment({
            deployment_id: item.id,
            owner,
            repo,
          });
        } catch (error: any) {
          console.error(error.message);
        }
      }
    }
  });

  describe('cli test', () => {
    it.skip('version', async () => {
      const version = execSync('npx ts-node ./src/cli.ts --version', {
        encoding: 'utf8',
      });
      expect(typeof version === 'string').toBeTruthy();
      expect(version?.split('.')).toHaveLength(3);
    });

    it.skip('bad credentials error', async () => {
      const token = 'fake_token';

      try {
        const stdout = execSync(
          [
            `npx ts-node ./src/cli.ts start`,
            `-o ${owner}`,
            `-r ${repo}`,
            `-t ${token}`,
            `--max-commits 1 --min-commits 1 --max-files 1 --min-files 1 --issues 1 --stale 7`,
          ].join(' '),
          { encoding: 'utf8' },
        );
        fail('test fails');
      } catch (err: any) {
        expect(err.message).toContain('Bad credentials');
      }
    });

    it.skip('start', async () => {
      try {
        const stdout = execSync(
          [
            `npx ts-node ./src/cli.ts start`,
            `-o ${owner}`,
            `-r ${repo}`,
            `-t ${token}`,
            `--max-commits 1 --min-commits 1 --max-files 1 --min-files 1 --issues 1 --stale 7`,
          ].join(' '),
          { encoding: 'utf8' },
        );
      } catch (error) {
        fail('test fails');
      }
    });
  });
});
