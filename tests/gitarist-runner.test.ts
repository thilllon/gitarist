import dotenv from 'dotenv';
import { GitaristRunner } from '../src/gitarist-runner';

jest.setTimeout(300000);

describe('should be able to generate templates', () => {
  let runner: GitaristRunner;

  beforeAll(async () => {
    dotenv.config({ path: '.env.test' });
    runner = new GitaristRunner();
  });

  test('runImitateActiveUser', async () => {
    await runner.runImitateActiveUser({
      maxCommits: 1,
      minCommits: 1,
      maxFiles: 2,
      minFiles: 2,
    });
    expect(true).toBe(true);
  });

  test.skip('runListRepositories', async () => {
    const repositoriesFixture: any[] = [
      {
        id: 1,
        name: 'test',
        full_name: 'test',
        owner: {
          login: 'test',
        },
      },
      {
        id: 2,
        name: 'test2',
        full_name: 'test2',
        owner: {
          login: 'test2',
        },
      },
    ];

    jest.spyOn(runner, 'listRepositories').mockResolvedValueOnce(repositoriesFixture);
    const response = await runner.runListRepositories({
      owner: 'test',
      ownerLogin: 'test',
      perPage: 1,
      rawLogPath: 'test',
      repoLogPath: 'test',
    });
    expect(response).toEqual(repositoriesFixture);
  });

  test.skip('runListBranches', async () => {
    const branches = await runner.runListGitBranch({ ref: 'commits/*' });
    console.log(branches);
  });
});
