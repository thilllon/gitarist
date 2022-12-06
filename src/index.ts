import dotenv from 'dotenv';
import { Gitt } from './Gitt';

dotenv.config();

const token = process.env.GITT_TOKEN;
const owner = process.env.GITT_OWNER ?? 'thilllon';
const repo = process.env.GITT_REPO ?? 'gitt';

const main = async () => {
  const gitt = new Gitt({ token });

  await gitt.createCommits({
    owner,
    repo,
    branch: 'main',
    numFiles: 10,
    // numCommits: Math.floor(Math.random() * 3 + 1),
    numCommits: 1,
    removeOptions: {
      // staleTimeMs: 86400 * 1000,
      staleTimeMs: 1 * 1000,
    },
  });

  // await gitt.createIssues({
  //   owner,
  //   repo,
  //   numIssues: 2,
  // });

  // await gitt.closeIssues({
  //   owner,
  //   repo,
  //   staleTimeInSeconds: 0,
  // });

  // await gitt.deleteRepoWorkflowLogs({
  //   owner,
  //   repo,
  //   staleTimeInSeconds: 3600,
  // });

  // await gitt.createPullRequest({
  //   owner,
  //   repo,
  //   dirName: '__pullrequest',
  // });
};

main();
