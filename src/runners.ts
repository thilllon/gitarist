import dotenv from 'dotenv';
import { Gitarist } from './gitarist';

const validate = () => {
  dotenv.config();

  const owner = process.env.GITARIST_OWNER;
  const repo = process.env.GITARIST_REPO;
  const authToken = process.env.GITARIST_TOKEN;

  if (!owner) {
    throw new Error('Missing required environment variables: "GITARIST_OWNER"');
  }
  if (!repo) {
    throw new Error('Missing required environment variables: "GITARIST_REPO"');
  }
  if (!authToken) {
    throw new Error('Missing required environment variables: "GITARIST_TOKEN"');
  }

  return { owner, repo, authToken };
};

/**
 * Imitate an active user
 */
export const runImitateActiveUser = async () => {
  const { owner, repo, authToken } = validate();

  const gitarist = new Gitarist({ authToken });

  await gitarist.mimicIssue({ owner, repo });

  await gitarist.mimicPullRequest({
    owner,
    repo,
    reviewOptions: {
      content: 'LGTM',
    },
  });

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

export const runListRepositories = async () => {
  const { owner, repo, authToken } = validate();
  const gitarist = new Gitarist({ authToken });

  await gitarist.listRepositories({ owner, ownerLogin: owner });
};

export const runCleanupRepositories = async () => {
  const { owner, repo, authToken } = validate();
  const gitarist = new Gitarist({ authToken });

  await gitarist.deleteRepos({ owner, targetPath: 'repos.json' });
};
