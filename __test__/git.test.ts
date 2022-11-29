import { describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';
import fs from 'fs';
import { Gitt } from '../src/Gitt';

let gitt: Gitt;

beforeAll(async () => {
  gitt = new Gitt();
  dotenv.config({ path: '.env.test' });

  const auth = process.env.GIT_GITHUB_REPO_PUSH_TOKEN;

  console.log(auth);

  if (!auth) {
    throw new Error('No auth token found');
  }
});

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(gitt.sum(1, 2)).toBe(3);
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

  test('create commits', async () => {
    await gitt.createFiles({
      numFiles: 10,
      relPath: '.test',
    });

    expect(() => {
      const files = fs.readdirSync('.test');
      console.log(files);
      return files;
    }).toBeDefined();
    fs.rmdirSync('.test', { recursive: true });
  });
});
