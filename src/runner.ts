import dotenv from 'dotenv';
import { Gitarist } from './Gitarist';

dotenv.config();

export const runner = async () => {
  const token = process.env.GITARIST_TOKEN;
  const owner = process.env.GITARIST_OWNER;
  const repo = process.env.GITARIST_REPO;

  const gitarist = new Gitarist({ token });

  await gitarist.createCommits({
    owner,
    repo,
    branch: 'main',
    numFiles: 2,
    numCommits: Math.floor(Math.random() * 3 + 1),
    removeOptions: {
      staleTimeMs: 86400 * 1000,
    },
  });

  await gitarist.createIssues({
    owner,
    repo,
    numIssues: 3,
  });

  await gitarist.closeIssues({
    owner,
    repo,
    staleTimeMs: 0,
  });

  await gitarist.deleteRepoWorkflowLogs({
    owner,
    repo,
    staleTimeMs: 86400 * 1000,
  });

  await gitarist.createPullRequest({
    owner,
    repo,
  });
};
