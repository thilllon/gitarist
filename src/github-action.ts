import { DEFAULT, Gitarist } from './github';

/**
steps:
  - uses: thilllon/gitarist@v1.0.0
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      GITHUB_OWNER: ${{ github.repository_owner }}
      GITHUB_REPO: ${{ github.event.repository.name }}
 */

async function main() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner) {
    throw new Error('Check your environment variables. GITHUB_OWNER is missing');
  }
  if (!repo) {
    throw new Error('Check your environment variables. GITHUB_REPO is missing');
  }
  if (!token) {
    throw new Error('Check your environment variables. GITHUB_TOKEN is missing');
  }

  const gitarist = new Gitarist({ owner, repo, token });
  await gitarist.simulateActiveUser({
    mainBranch: DEFAULT.mainBranch,
    maxCommits: DEFAULT.maxCommits,
    maxFiles: DEFAULT.maxFiles,
    minCommits: DEFAULT.minCommits,
    minFiles: DEFAULT.minFiles,
    numberOfIssues: DEFAULT.numberOfIssues,
    workingBranchPrefix: DEFAULT.workingBranchPrefix,
    stale: DEFAULT.stale,
  });
}

main();
