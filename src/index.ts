import dotenv from 'dotenv';
import { Gitt } from './Gitt';

dotenv.config();

const owner = process.env.GITT_OWNER;
const repo = process.env.GITT_REPO;

const main = async () => {
  const gitt = new Gitt();

  await gitt.createCommits({
    owner,
    repo,
    branch: 'main',
    numFiles: 2,
    dirName: '__commit',
    numCommits: Math.floor(Math.random() * 3 + 1),
    removeOptions: {
      staleTimeInSeconds: 0,
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
  //   staleTimeInSeconds: 86400,
  // });

  // await gitt.createPullRequest({
  //   owner,
  //   repo,
  //   dirName: '__pullrequest',
  // });
};

main();
