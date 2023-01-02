import dotenv from 'dotenv';
import { Gitarist } from './gitarist';

export const runner = async () => {
  dotenv.config();

  const owner = process.env.GITARIST_OWNER;
  const repo = process.env.GITARIST_REPO;
  const token = process.env.GITARIST_TOKEN;

  if (!owner) {
    throw new Error('Missing required environment variables: "GITARIST_OWNER"');
  }
  if (!repo) {
    throw new Error('Missing required environment variables: "GITARIST_REPO"');
  }
  if (!token) {
    throw new Error('Missing required environment variables: "GITARIST_TOKEN"');
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
