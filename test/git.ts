import fs from 'fs';
import { describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';
import { createFiles, sum } from '../src/git';

beforeAll(async () => {
  dotenv.config({ path: '.env.test' });
});

afterAll(async () => {
  //
});

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
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
    await createFiles({
      numFiles: 10,
      relPath: '.test',
    });

    expect(() => {
      const files = fs.readdirSync('.test');
      console.log(files);
      return files;
    }).toBeDefined();
  });
});

afterAll(async () => {
  fs.rmdirSync('.test', { recursive: true });
});
