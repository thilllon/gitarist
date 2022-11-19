import dotenv from 'dotenv';
import glob from 'fast-glob';
import fs from 'fs';
import { readFile } from 'fs-extra';
import { Octokit } from 'octokit';
import path from 'path';

// https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0

dotenv.config();

const tokenName = 'GIT_GITHUB_REPO_PUSH_TOKEN';

type GitCreateTreeParamsTree = any; // TODO: fix this type

const getFileAsUTF8 = (filePath: string) => readFile(filePath, 'utf8');

const createFiles = (coursePath: string, length: number) => {
  const targetDir = path.join(process.cwd(), coursePath);
  fs.mkdirSync(targetDir, { recursive: true });

  const files = Array.from({ length })
    .map(() => {
      try {
        const now = Date.now().toString();
        const content = (now + '\n').repeat(100);
        const filePath = path.join(targetDir, now);
        fs.writeFileSync(filePath, content, 'utf8');
        return filePath;
      } catch (err) {
        console.log(err);
      }
    })
    .filter((file): file is string => !!file);

  return files;
};

const removeStaleFiles = (staleTimeInSeconds: number) => {
  glob.sync(['*'], { onlyDirectories: true }).forEach((dir) => {
    if (new Date(dir) < new Date(Date.now() - staleTimeInSeconds * 1000)) {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    }
  });
};

export const gitCommit = async (
  repo: string,
  owner: string,
  branch: string,
  numFiles = 10,
  coursePath = '.tmp',
  staleTimeInSeconds = 86400 * 3
) => {
  try {
    const now = Date.now().toString();
    const iso = new Date().toISOString();

    const auth = process.env[tokenName];
    if (!auth) {
      throw new Error('environment variable is not defined: ' + tokenName);
    }
    const octokit = new Octokit({ auth });

    createFiles(coursePath, numFiles);
    removeStaleFiles(staleTimeInSeconds);

    // gets commit's AND its tree's SHA
    const ref = `heads/${branch}`;
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref,
    });
    const commitSha = refData.object.sha;
    const { data: lastCommit } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });

    const treeSha = lastCommit.tree.sha;
    const filesPaths = glob.sync([coursePath + '/*']);
    const filesBlobs = await Promise.all(
      filesPaths.map(async (filePath) => {
        const content = await getFileAsUTF8(filePath);
        const encoding = 'utf-8';
        const blobData = await octokit.rest.git.createBlob({
          owner,
          repo,
          content,
          encoding,
        });
        return blobData.data;
      })
    );
    const pathsForBlobs = filesPaths.map((fullPath) =>
      path.relative(coursePath, fullPath)
    );

    const tree: GitCreateTreeParamsTree[] = filesBlobs.map(
      ({ sha }, index) => ({
        path: now + '/' + pathsForBlobs[index],
        mode: `100644`,
        type: `blob`,
        sha,
      })
    );
    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo,
      tree,
      base_tree: treeSha,
    });

    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: iso,
      tree: newTree.sha,
      parents: [refData.object.sha],
    });

    // THE MOST IMPORTANT PART(git push)
    await octokit.rest.git.updateRef({ owner, repo, ref, sha: newCommit.sha });
  } catch (err) {
    console.error(err);
  } finally {
    const targetDir = path.join(process.cwd(), coursePath);
    fs.rmSync(targetDir, { recursive: true, force: true, maxRetries: 10 });
  }
};
