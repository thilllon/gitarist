import dotenv from 'dotenv';
import { Gitt } from './Gitt';

dotenv.config();

const main = async () => {
  const gitt = new Gitt();

  await gitt.createCommits({
    repo: 'commit',
    owner: 'thilllon',
    branch: 'main',
    numFiles: 2,
    relPath: '.commit',
    numCommits: Math.floor(Math.random() * 3 + 1),
  });

  await gitt.createIssues({ repo: 'commit', owner: 'thilllon', numIssues: 2 });

  await gitt.closeIssues({
    repo: 'commit',
    owner: 'thilllon',
    staleTimeInSeconds: 2 * 86400,
  });
};

main();
