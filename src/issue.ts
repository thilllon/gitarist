import dotenv from 'dotenv';
import { Octokit } from 'octokit';

dotenv.config();

const tokenName = 'GIT_GITHUB_REPO_PUSH_TOKEN';

export const createIssues = async ({
  repo,
  owner,
  numIssues = 1,
}: {
  repo: string;
  owner: string;
  numIssues?: number;
}) => {
  for (const _ of Array(numIssues).keys()) {
    try {
      const iso = new Date().toISOString();
      const content = (iso + '\n').repeat(2);
      const auth = process.env[tokenName];
      if (!auth) {
        throw new Error('environment variable is not defined: ' + tokenName);
      }
      const octokit = new Octokit({ auth });
      const created = await octokit.rest.issues.create({
        owner,
        repo,
        title: iso,
        body: content,
        assignees: [owner],
      });

      const issueNumber = created.data.number;

      const comment = await octokit.rest.issues.createComment({
        owner,
        repo,
        body: content,
        issue_number: issueNumber,
      });
    } catch (err) {
      console.error(err);
    }
  }
};

// TODO: https://github.com/octokit/octokit.js/discussions/2343

export const closeIssues = async ({
  repo,
  owner,
  staleTimeInSeconds = 3 * 86400,
}: {
  repo: string;
  owner: string;
  staleTimeInSeconds?: number;
}) => {
  try {
    const auth = process.env[tokenName];
    if (!auth) {
      throw new Error('environment variable is not defined: ' + tokenName);
    }
    const octokit = new Octokit({ auth });

    const issues = await octokit.rest.issues.list({
      per_page: 100,
      state: 'open',
    });
    const filtered = issues.data.filter(
      (elem) => elem.repository?.name === repo
    );

    await Promise.all(
      filtered.map(async (issue) => {
        try {
          if (
            issue.created_at &&
            new Date(issue.created_at) <
              new Date(Date.now() - staleTimeInSeconds * 1000)
          ) {
            await octokit.rest.issues.update({
              owner,
              repo,
              issue_number: issue.number,
              state: 'closed',
              state_reason: 'completed',
            });
          }
        } catch (err) {
          console.log(issue.number);
        }
      })
    );
  } catch (err) {
    console.error(err);
  }
};
