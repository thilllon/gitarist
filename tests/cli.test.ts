import { describe, expect, test } from '@jest/globals';
import dotenv from 'dotenv';

beforeAll(async () => {
  dotenv.config({ path: '.env.test' });
});

describe('dummy', () => {
  test('trivial', () => {
    expect(1).toBe(1);
  });
});
