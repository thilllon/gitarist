import dotenv from 'dotenv';
import { Gitt } from './Gitt';

dotenv.config();

const main = async () => {
  const gitt = new Gitt();

  await gitt.createCommits({
    repo: 'gitt',
    owner: 'thilllon',
    branch: 'main',
    numFiles: 2,
    relPath: '.gitt',
    numCommits: Math.floor(Math.random() * 3 + 1),
    removeOptions: {
      staleTimeInSeconds: 2 * 86400,
    },
  });

  await gitt.createIssues({
    repo: 'gitt',
    owner: 'thilllon',
    numIssues: 2,
  });

  await gitt.closeIssues({
    repo: 'gitt',
    owner: 'thilllon',
    staleTimeInSeconds: 2 * 86400,
  });

  await gitt.deleteRepoWorkflowLogs({
    repo: 'gitt',
    owner: 'thilllon',
    staleTimeInSeconds: 2 * 86400,
  });
};

main();
