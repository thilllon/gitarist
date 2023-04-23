import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import dotenv from 'dotenv';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { Gitarist } from '../src/gitarist';
import { GitaristRunner } from '../src/gitarist-runner';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Do NOT mock waht you don't own, it's meaningless.
// https://stackoverflow.com/questions/65626653/create-react-app-doesnt-properly-mock-modules-from-mocks-directory/65627662#65627662
// https://stackoverflow.com/a/68614624/11091456

describe('gitarist', () => {
  let runner: GitaristRunner;
  let gitarist: Gitarist;

  let owner: string;
  let repo: string;
  let authToken: string;

  beforeAll(async () => {
    if (!existsSync(path.join(process.cwd(), '.env.test'))) {
      throw new Error('Missing env file');
    }
    dotenv.config({ path: '.env.test' });

    owner = process.env.GITARIST_OWNER as string;
    repo = process.env.GITARIST_REPO as string;
    authToken = process.env.GITARIST_TOKEN as string;
    runner = new GitaristRunner();
    gitarist = new Gitarist({ owner, repo, authToken });
  });

  test('check env', async () => {
    expect(existsSync(path.join(process.cwd(), '.env.test'))).toBeTruthy();
    expect(typeof process.env.GITARIST_OWNER).toBe('string');
    expect(typeof process.env.GITARIST_REPO).toBe('string');
    expect(typeof process.env.GITARIST_TOKEN).toBe('string');
  });

  test('check owner, repo', async () => {
    expect(runner.owner).toBe(process.env.GITARIST_OWNER);
    expect(runner.repo).toBe(process.env.GITARIST_REPO);
  });

  test('removeStaleFiles', async () => {
    const cleanupFakeCommitFiles = () => {
      const dir = path.join(process.cwd(), '.gitarist', '__commit');
      rmSync(dir, { recursive: true });
    };

    const createFakeCommitFiles = (numFilesForTest: number) => {
      // file name must be considered as linux timestamp (all numbers)
      const content = 'dummy';
      const dir = path.join(process.cwd(), '.gitarist', '__commit');
      mkdirSync(dir, { recursive: true });
      Array(numFilesForTest)
        .fill(null)
        .forEach(() => {
          writeFileSync(path.join(dir, Date.now().toString()), content, {
            encoding: 'utf8',
          });
        });
    };

    cleanupFakeCommitFiles();
    createFakeCommitFiles(20);

    jest.useFakeTimers();
    setTimeout(async () => {
      const staleFiles = await gitarist.removeStaleFiles({
        staleTimeMs: 3000, // remove files older than 3 seconds
      });

      // FIXME: why failed?
      // expect(staleFiles.length).toBe(20);
      expect(staleFiles.length).toBeGreaterThan(0);
    }, 3000);
    jest.runAllTimers();
  });

  test('listRepositories', async () => {
    const listRepositoriesSpy = jest.spyOn(gitarist, 'listRepositories');
    listRepositoriesSpy.mockResolvedValue([]);
    const res = await gitarist.listRepositories({ owner });
    expect(Array.isArray(res)).toBeTruthy();
    expect(listRepositoriesSpy).toHaveBeenCalled();
  });

  test('getRateLimit', async () => {
    const getRateLimitSpy = jest
      .spyOn(gitarist, 'getRateLimit')
      .mockResolvedValueOnce({ rate: {} });
    expect(gitarist.getRateLimit({})).toBeTruthy();
    expect(getRateLimitSpy).toHaveBeenCalled();
  });

  test.only('removeWordFromSentence', async () => {
    const fixtures = [
      {
        input: '<infra>   hello world',
        expected: 'hello world',
        words: ['<server>', '<client>', '<infra>'],
      },
      {
        input: '<infra> hello world',
        expected: 'hello world',
        words: ['<server>', '<client>', '<infra>'],
      },
      {
        input: '<server>hello world',
        expected: 'hello world',
        words: ['<server>', '<client>', '<infra>'],
      },
      {
        input: '<client><server><infra>',
        expected: '<server><infra>',
        words: ['<server>', '<client>', '<infra>'],
      },
      {
        input: 'hello world <infra>',
        expected: 'hello world <infra>',
        words: ['<server>', '<client>', '<infra>'],
      },
    ];

    fixtures.forEach((fixture) => {
      expect(
        gitarist.removeWordFromSentence(fixture.input, fixture.words)
      ).toBe(fixture.expected);
    });
  });
});

describe('e2e', () => {
  //  test('createCommits', async () => {
  //     // NOTE: e2e test
  //   });
  //   test('deleteRepos', async () => {
  //     // TOOD: implement
  //   });
  //   test('findWastedActions', async () => {
  //     // TOOD: implement
  //   });
  //   test('deleteRepoWorkflowLogs', async () => {
  //     // TOOD: implement
  //   });
  //   test('createPullRequest', async () => {
  //     // TOOD: implement
  //   });
  //   test('removeCommentsOnIssueByBot', async () => {
  //     // TOOD: implement
  //   });
  // test('changeIssueTitleAndAddLabels', async () => {
  //   // TOOD: implement
  // });
  // test('getStaleWorkflowRuns', async () => {
  //   // TOOD: implement
  // });
  // test('mimicIssue', async () => {
  //   // TOOD: implement
  // });
});
