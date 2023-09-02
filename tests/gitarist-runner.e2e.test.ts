import dotenv from 'dotenv';
import { GitaristRunner } from '../src/gitarist-runner';

jest.setTimeout(300000);

describe('should be able to generate templates', () => {
  let runner: GitaristRunner;

  beforeAll(async () => {
    dotenv.config({ path: '.env.test' });
    runner = new GitaristRunner();
  });

  test.todo('e2e test');
});
