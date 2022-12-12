import { describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

beforeAll(async () => {
  dotenv.config({ path: '.env.test' });
  const auth = process.env.GITARIST_TOKEN;
  console.log(auth);
  if (!auth) {
    throw new Error('No auth token found');
  }
});

describe('dummy', () => {
  test('trivial', () => {
    expect(1).toBe(1);
  });
});
