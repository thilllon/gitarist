// https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0

import dotenv from 'dotenv';
import { createCommits } from './commit';
import { closeIssues, createIssues } from './issue';

const main = async () => {
  await createCommits({
    repo: 'commit',
    owner: 'thilllon',
    branch: 'main',
    numFiles: 2,
    coursePath: '.commitfiles',
    numCommits: Math.floor(Math.random() * 3 + 1),
  });

  await createIssues({ repo: 'commit', owner: 'thilllon', numIssues: 2 });

  await closeIssues({
    repo: 'commit',
    owner: 'thilllon',
    staleTimeInSeconds: 2 * 86400,
  });
};

main();
