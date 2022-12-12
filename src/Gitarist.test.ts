import { describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Gitarist } from './Gitarist';

let gitarist: Gitarist;

beforeAll(async () => {
  dotenv.config({ path: '.env.test' });
  const auth = process.env.GITARIST_TOKEN;
  console.log(auth);
  if (!auth) {
    throw new Error('No auth token found');
  }

  gitarist = new Gitarist();
});

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(gitarist.sum(1, 2)).toBe(3);
  });

  // test('create commits', async () => {
  //   expect(
  //     createCommits({
  //       repo: 'test',
  //       branch: 'main',
  //       owner: 'thilllon',
  //     })
  //   );
  // });

  test('create files', async () => {
    const tmpFolder = '__tmp';
    const tmpDir = path.join(process.cwd(), '.gitarist', tmpFolder);
    await gitarist.createCommitFiles({ numFiles: 10 });

    expect(() => {
      const files = fs.readdirSync(tmpDir);
      console.log(files);
      return files;
    }).toBeDefined();

    fs.rmdirSync(tmpDir, { recursive: true });
  });
});
