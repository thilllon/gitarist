import { describe, expect, test } from '@jest/globals';
import { sum } from '../src/commit';

beforeAll(async () => {
  //
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
});
