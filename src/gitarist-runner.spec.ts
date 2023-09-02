import { GitaristRunner } from './gitarist-runner';

describe('GitaristRunner', () => {
  let runner: GitaristRunner;

  beforeAll(async () => {
    runner = new GitaristRunner();
  });

  it.skip('should imitate an active user', async () => {
    await runner.runImitateActiveUser({});
  });

  it.skip('should list repositories', async () => {
    await runner.runListRepositories({});
  });

  it.skip('should delete repositories', async () => {
    await runner.runDeleteRepositoryList({});
  });

  it.skip('should list branches', async () => {
    await runner.runListGitBranch({ ref: 'commits/*' });
  });

  it.skip('should clean up repository', async () => {
    await runner.runCleanUpRepository();
  });
});
