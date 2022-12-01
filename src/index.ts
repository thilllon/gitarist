import dotenv from 'dotenv';
import { Gitt } from './Gitt';

dotenv.config();

const main = async () => {
  const gitt = new Gitt();

  await gitt.createCommits({
    owner: 'thilllon',
    repo: 'gitt',
    branch: 'main',
    numFiles: 2,
    dirName: '__commit',
    numCommits: Math.floor(Math.random() * 3 + 1),
    removeOptions: {
      staleTimeInSeconds: 86400,
    },
  });

  await gitt.createIssues({
    owner: 'thilllon',
    repo: 'gitt',
    numIssues: 2,
  });

  await gitt.closeIssues({
    owner: 'thilllon',
    repo: 'gitt',
    staleTimeInSeconds: 0,
  });

  await gitt.deleteRepoWorkflowLogs({
    owner: 'thilllon',
    repo: 'gitt',
    staleTimeInSeconds: 86400,
  });

  await gitt.createPullRequest({
    owner: 'thilllon',
    repo: 'gitt',
    dirName: '__pullrequest',
  });
};

main();
