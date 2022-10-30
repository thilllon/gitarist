// https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0

import dotenv from 'dotenv';
import { gitCommit } from './commit';
import { createIssue, closeIssues } from './issue';

dotenv.config();

const main = async () => {
  const numCommits = Math.floor(Math.random() * 3 + 1);
  for await (const _ of Array(numCommits).keys()) {
    await gitCommit('commit', 'thilllon', 'main', 2, '.commitfiles');
  }

  for await (const _ of Array(2).keys()) {
    await createIssue('commit', 'thilllon');
  }

  await closeIssues('commit', 'thilllon', 3 * 86400);
};

main();
