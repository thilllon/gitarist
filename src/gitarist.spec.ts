import { describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Gitarist } from './gitarist.main';

let gitarist: Gitarist;

beforeAll(async () => {
  dotenv.config({ path: '.env.test' });
  gitarist = new Gitarist();
});

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(gitarist.sum(1, 2)).toBe(3);
  });

  // test('create commits', async () => {
  //   expect(
  //     createCommits({
  //       repo: process.env.GITARIST_REPO,
  //       branch: 'main',
  //       owner: process.env.GITARIST_OWNER,',
  //     })
  //   );
  // });

  test('create files', async () => {
    const tmpFolder = '__tmp';
    const tmpDir = path.join(process.cwd(), '.gitarist', tmpFolder);
    await gitarist.createCommitFiles({ numFiles: 10 });

    expect(() => {
      const files = fs.readdirSync(tmpDir);
      return files;
    }).toBeDefined();

    fs.rmdirSync(tmpDir, { recursive: true });
  });
});
