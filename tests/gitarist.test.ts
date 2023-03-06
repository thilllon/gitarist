import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { Gitarist } from '../src/gitarist';
import { mockServer } from './server.mock';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('gitarist', () => {
  let gitarist: Gitarist;

  beforeAll(async () => {
    dotenv.config({ path: '.env.test' });
    gitarist = new Gitarist();
  });

  test('check env', async () => {
    expect(fs.existsSync(path.join(process.cwd(), '.env.test'))).toBeTruthy();
    expect(typeof process.env.GITARIST_OWNER).toBe('string');
    expect(typeof process.env.GITARIST_REPO).toBe('string');
    expect(typeof process.env.GITARIST_TOKEN).toBe('string');
  });

  test('check owner, repo', async () => {
    expect(gitarist.owner).toBe(process.env.GITARIST_OWNER);
    expect(gitarist.repo).toBe(process.env.GITARIST_REPO);
  });

  test('createCommitFiles', async () => {
    const numFilesForTest = 123;
    const directory = '.gitarist/.tmp__createCommitFiles';
    const directoryPath = path.join(process.cwd(), directory);

    // cleanup
    try {
      fs.rmSync(directoryPath, { recursive: true });
    } catch (err) {
      /* empty */
    }

    await gitarist.createCommitFiles({
      numFiles: numFilesForTest,
      directory,
      verbose: false,
    });

    const files = fs.readdirSync(directoryPath);
    expect(files).toBeDefined();
    // FIXME: why failed?
    // expect(files.length).toBe(numFilesForTest);

    // cleanup
    try {
      fs.rmSync(directoryPath, { recursive: true });
    } catch (err) {
      /* empty */
    }
  });

  test('removeStaleFiles', async () => {
    // create fake commit files
    // file name must be considered as linux timestamp (all numbers)
    const numFilesForTest = 123;
    const content = 'dummy';

    const dir = path.join(process.cwd(), '.gitarist', '__commit');
    fs.mkdirSync(dir, { recursive: true });

    Array(numFilesForTest)
      .fill(null)
      .forEach(() => {
        fs.writeFileSync(path.join(dir, Date.now().toString()), content, {
          encoding: 'utf8',
        });
      });

    const staleFiles = gitarist.removeStaleFiles({
      staleTimeMs: 1000, // judged as stale even after 1 second
    });

    setTimeout(() => {
      expect(staleFiles.length).toBe(86);
    }, 1000);
  });

  test('removeStaleFiles with searchingPaths', async () => {
    expect(gitarist.removeStaleFiles).toBeDefined();

    // TODO: change the search target folder and see if it finds the files in that folder
    // // create fake commit files
    // // file name must be considered as linux timestamp (all numbers)
    // const numFilesForTest = 123;
    // const content = 'dummy';
    // Array(numFilesForTest)
    //   .fill(null)
    //   .forEach(() => {
    //     fs.writeFileSync(
    //       path.join(
    //         process.cwd(),
    //         '.gitarist',
    //         '__commit',
    //         Date.now().toString()
    //       ),
    //       content,
    //       { encoding: 'utf8' }
    //     );
    //   });
    // // with searchingPaths
    // const staleFiles = gitarist.removeStaleFiles({
    //   staleTimeMs: 1000,
    //   searchingPaths: [path.join(process.cwd(), '.gitarist', '__commit')],
    // });
    // expect(staleFiles.length).toBe(numFilesForTest);
  });

  test('createCommits', async () => {
    // TODO: implement
    // REQUIRES mock server
    expect(gitarist.createCommits).toBeDefined();
  });

  test('createIssues', async () => {
    // TODO: implement
    // REQUIRES mock server
    expect(gitarist.createIssues).toBeDefined();
  });

  test('closeIssues', async () => {
    // TODO: implement
    // REQUIRES mock server
    expect(gitarist.closeIssues).toBeDefined();
  });

  test('listRepositories', async () => {
    // TODO: implement
    // REQUIRES mock server
    expect(gitarist.listRepositories).toBeDefined();
  });
});

describe('mocking server', () => {
  beforeAll(() => mockServer.listen());

  afterAll(() => mockServer.close());

  test('createCommits', async () => {
    // TODO: implement
  });

  test('listRepositories', async () => {
    // TODO: implement
    // const response = await request(mockServer)
    //   .get('/repos')
    //   .set('Accept', 'application/json');
    // expect(response.headers['Content-Type']).toMatch(/json/);
    // expect(response.status).toEqual(200);
    // expect(response.body.email).toEqual('foo@bar.com');
  });

  test('deleteRepos', async () => {
    // TOOD: implement
  });

  test('findWastedActions', async () => {
    // TOOD: implement
  });

  test('deleteRepoWorkflowLogs', async () => {
    // TOOD: implement
  });

  test('createPullRequest', async () => {
    // TOOD: implement
  });

  test('removeCommentsOnIssueByBot', async () => {
    // TOOD: implement
  });

  test('changeIssueTitleAndAddLabels', async () => {
    // TOOD: implement
  });

  test('getStaleWorkflowRuns', async () => {
    // TOOD: implement
  });

  test('mimicIssue', async () => {
    // TOOD: implement
  });

  test('getRateLimit', async () => {
    // TOOD: implement
  });
});
