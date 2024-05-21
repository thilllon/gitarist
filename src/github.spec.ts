import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { mkdirSync, rmdirSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { Octokit } from 'octokit';
import { dirname, join } from 'path';
import { chdir } from 'process';
import { Gitarist, IssueItem } from './github';

jest.setTimeout(999999999);

describe('gitarist', () => {
  dotenv.config({ path: '.env.test' });

  let gitarist: Gitarist;
  let octokit: Octokit;

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  beforeAll(async () => {
    gitarist = new Gitarist({ owner, repo, token });
    octokit = new Octokit({ auth: token });
    jest.resetAllMocks();
  });

  it.skip('setup', async () => {
    // FIXME: `open` is not working on commonjs
    const targetDir = join(process.cwd(), '.gitarist', `directory_${Date.now()}`);
    mkdirSync(targetDir, { recursive: true });
    chdir(targetDir);
    execSync('git init');
    execSync('cd');
    await Gitarist.setup({});
    expect(true).toBeTruthy();
    rmdirSync(targetDir);
  });

  it.skip('simulate active user', async () => {
    const deleteOldWorkflowLogsSpy = jest.spyOn(gitarist, 'deleteOldWorkflowLogs');
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

  it.skip('deleteFolder', async () => {
    await gitarist.deleteFolder({ folderPaths: [] });
  });

  it.skip('resolve all unresolved review comments', async () => {
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
    for await (const response of octokit.paginate.iterator(octokit.rest.repos.listDeployments, {
      owner,
      repo,
    })) {
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

  it.skip('createMultipleIssues', async () => {
    const issueItems: IssueItem[] = [
      {
        title: 'lorem ipsum',
        body: '',
        labels: undefined,
        assignee: undefined,
      },
    ];
    await gitarist.createMultipleIssues({ issueItems });
  });

  it.skip('createIssuesFromJson', async () => {
    const issues: IssueItem[] = Array.from({ length: 4 }).map((_, index) => ({
      title: 'title ' + index,
      body: 'body ' + index,
    }));
    const filePath = './.gitarist/testIssues.json';
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(issues), 'utf-8');
    await gitarist.createIssuesFromJson({ relativePath: filePath });

    const errorSpy = jest.spyOn(console, 'error');
    const invalidIssues: IssueItem[] = [
      {
        title: 'invalid title',
        body: 'invalid body',
        labels: '',
      },
    ];
    const invalidFilePath = './.gitarist/testInvalidIssues.json';
    await mkdir(dirname(invalidFilePath), { recursive: true });
    await writeFile(invalidFilePath, JSON.stringify(invalidIssues), 'utf-8');
    await gitarist.createIssuesFromJson({ relativePath: invalidFilePath });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      'Validation Failed: {"resource":"Label","field":"name","code":"missing_field"}',
    );
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
        execSync(
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
        execSync(
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
