import chalk from 'chalk';
import dotenv from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { Gitarist } from './gitarist';
import { Templates } from './gitarist.template';

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

export const initCommand = (dir = '') => {
  const workflowDir = path.join(process.cwd(), dir, '.github', 'workflows');
  mkdirSync(workflowDir, { recursive: true });

  writeFileSync(
    path.join(workflowDir, 'gitarist.yml'),
    Templates.getActionTemplate(),
    { encoding: 'utf8', flag: 'w+' }
  );

  writeFileSync(
    path.join(process.cwd(), dir, '.env'),
    Templates.getEnvTemplate(),
    { encoding: 'utf8', flag: 'a+' }
  );

  console.log(`\nGenerate a secret key settings:`);
  console.log(
    chalk.greenBright.bold(
      `https://github.com/settings/tokens/new?description=GITARIST_TOKEN&scopes=repo,read:packages,read:org,delete_repo,workflow`
    )
  );

  console.log(`\nRegister the secret key to action settings:`);
  console.log(
    chalk.greenBright.bold(`https://github.com/<USERNAME>/${dir}/settings/new`)
  );
};

/**
 * Imitate an active user
 */
export const runImitateActiveUser = async ({
  maxCommits,
  minCommits,
  maxFiles,
  minFiles,
}: {
  maxCommits?: number;
  minCommits?: number;
  maxFiles?: number;
  minFiles?: number;
}) => {
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
    numFiles: { min: minFiles ?? 1, max: maxFiles ?? 10 },
    numCommits: { min: minCommits ?? 1, max: maxCommits ?? 10 },
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
