import dotenv from 'dotenv';
import { Gitarist } from './Gitarist';

export const runner = async () => {
  dotenv.config();
  const token = process.env.GITARIST_TOKEN as string;
  const owner = process.env.GITARIST_OWNER as string;
  const repo = process.env.GITARIST_REPO as string;

  const gitarist = new Gitarist({ token });
  console.log('###');
  console.log('###');
  console.log('###');
  console.log('###');
  await gitarist.createCommits({
    owner,
    repo,
    branch: 'main',
    numFiles: 1,
    numCommits: 1,
    // numFiles: { min: 1, max: 1 },
    // numCommits: { min: 1, max: 3 },
    removeOptions: {
      staleTimeMs: 86400 * 1000,
    },
  });

  // await gitarist.createIssues({
  //   owner,
  //   repo,
  //   numIssues: 3,
  // });

  // await gitarist.closeIssues({
  //   owner,
  //   repo,
  //   staleTimeMs: 0,
  // });

  // await gitarist.deleteRepoWorkflowLogs({
  //   owner,
  //   repo,
  //   staleTimeMs: 86400 * 1000,
  // });

  // await gitarist.createPullRequest({
  //   owner,
  //   repo,
  // });
};
