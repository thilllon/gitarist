import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import exp from 'constants';
import dotenv from 'dotenv';

beforeAll(async () => {
  dotenv.config({ path: '.env.test' });
});

describe('CLI test', () => {
  test('trivial', () => {
    expect(1).toBe(1);
  });

  // test('show log', () => {
  //   const consoleLogSpy = jest.spyOn(console, 'log');
  //   console.log('hello');
  //   expect(consoleLogSpy).toHaveBeenCalledWith('hello');
  // });
});
