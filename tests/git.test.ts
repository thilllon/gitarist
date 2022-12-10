import { describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';
import fs from 'fs';
import { Gitt } from '../src/Gitt';

let gitt: Gitt;

beforeAll(async () => {
  dotenv.config({ path: '.env.test' });
  const auth = process.env.GITT_TOKEN;
  console.log(auth);
  if (!auth) {
    throw new Error('No auth token found');
  }

  gitt = new Gitt();
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

  test('create files', async () => {
    const dirName = '__tmp';
    await gitt.createCommitFiles({
      numFiles: 10,
      // dirName,
    });

    expect(() => {
      const files = fs.readdirSync(dirName);
      console.log(files);
      return files;
    }).toBeDefined();
    fs.rmdirSync(dirName, { recursive: true });
  });
});
