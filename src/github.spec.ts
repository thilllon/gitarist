import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { mkdirSync, rmdirSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { Octokit } from 'octokit';
import path, { dirname, join } from 'path';
import { chdir } from 'process';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { Gitarist, IssueItem } from './github';

describe('gitarist', () => {
  dotenv.config({ path: path.join(process.cwd(), '..', '.env.test') });

  let gitarist: Gitarist;
  let octokit: Octokit;

  const owner = process.env.GITHUB_OWNER ?? 'thilllon';
  const repo = process.env.GITHUB_REPO ?? 'turing';
  const token = process.env.GITHUB_TOKEN ?? '';

  beforeAll(async () => {
    gitarist = new Gitarist({ owner, repo, token });
    octokit = new Octokit({ auth: token });
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

  it.skip('simulate active user', { timeout: 300 * 1000 }, async () => {
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
  });

  it.skip('findWastedActionsOverAllRepositories', async () => {
    await gitarist.findWastedActionsOverAllRepositories();
  });

  it.skip('deleteFolder', async () => {
    await gitarist.deleteFolder({ folderPaths: [] });
  });

  it.skip('resolveAllReviewComments', async () => {
    await gitarist.resolveAllReviewComments();

    expect(true).toBeTruthy();
  });

  it.skip('deleteOldIssues', async () => {
    await gitarist.deleteOldIssues({
      olderThan: new Date('2023-12-06'),
    });

    expect(true).toBeTruthy();
  });

  it('deleteOldFilesAndCommit', async () => {
    await gitarist.deleteOldFiles({
      olderThan: new Date(Date.now() - 28 * 86400 * 1000),
      mainBranch: 'main',
    });

    expect(true).toBeTruthy();
  });

  it('listBranches', async () => {
    const branches = await gitarist.listBranches({
      ref: 'heads/ISSUE-',
    });

    expect(Array.isArray(branches)).toBeTruthy();
  });

  it.skip('deleteBranches', async () => {
    await gitarist.deleteBranches({ ref: 'heads/bug-' });

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

  it('createMultipleIssues', async () => {
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

  test('createIssuesFromJson', { timeout: 60 * 1000 }, async () => {
    const issues: IssueItem[] = Array.from({ length: 4 }).map((_, index) => ({
      title: 'title ' + index,
      body: 'body ' + index,
    }));
    const filePath = './.gitarist/testIssues.json';
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(issues), 'utf-8');
    await gitarist.createIssuesFromJson({ relativePath: filePath });

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
  });

  describe('cli test', () => {
    it('version', async () => {
      const version = execSync('npx tsx ../src/cli.mts --version', {
        encoding: 'utf8',
      });
      expect(typeof version === 'string').toBeTruthy();
      expect(version?.split('.')).toHaveLength(3);
    });

    it('bad credentials error', async () => {
      const token = 'invalid_token';

      expect(() =>
        execSync(
          [
            `npx tsx ../src/cli.mts start`,
            `--owner ${owner}`,
            `--repo ${repo}`,
            `--token ${token}`,
          ].join(' '),
          { encoding: 'utf8' },
        ),
      ).toThrow('Bad credentials');
    });

    it.skip('start', async () => {
      expect(() =>
        execSync(
          [
            `npx tsx ../src/cli.mts start`,
            `-o ${owner}`,
            `-r ${repo}`,
            `-t ${token}`,
            `--max-commits 1 --min-commits 1 --max-files 1 --min-files 1 --issues 1 --stale 7`,
          ].join(' '),
          { encoding: 'utf8' },
        ),
      ).toThrow('Bad credentials');
    });
  });
});
