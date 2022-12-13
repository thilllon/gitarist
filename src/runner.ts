import dotenv from 'dotenv';
import { Gitarist } from './Gitarist';

export const runner = async () => {
  dotenv.config();

  const token = process.env.GITARIST_TOKEN;
  const owner = process.env.GITARIST_OWNER;
  const repo = process.env.GITARIST_REPO;

  if (!token || !owner || !repo) {
    throw new Error('Missing required environment variables');
  }

  const gitarist = new Gitarist({ token });

  await gitarist.mimicIssue({ owner, repo });

  await gitarist.mimicPullRequest({ owner, repo });

  await gitarist.createCommits({
    owner,
    repo,
    branch: 'main',
    numFiles: { min: 1, max: 10 },
    numCommits: { min: 1, max: 1 },
    removeOptions: {
      staleTimeMs: 86400 * 1000,
    },
  });

  await gitarist.deleteRepoWorkflowLogs({
    owner,
    repo,
    staleTimeMs: 86400 * 1000,
  });
};
