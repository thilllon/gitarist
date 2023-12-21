import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { Gitlaborator } from './gitlaborator';

jest.setTimeout(3600000);

describe('gitlaborator', () => {
  dotenv.config({ path: '.env.test' });

  it.skip('should be defined', async () => {
    expect(
      new Gitlaborator({
        projectId: process.env.GITLAB_PROJECT_ID,
        options: {
          token: process.env.GITLAB_TOKEN,
        },
      }),
    ).toBeDefined();
  });

  it.skip('createEnvByProjectVariables', async () => {
    const gitlaborator = new Gitlaborator({
      projectId: process.env.GITLAB_PROJECT_ID,
      options: {
        token: process.env.GITLAB_TOKEN,
        host: 'https://git.baemin.in',
      },
    });

    await gitlaborator.createEnvByProjectVariables({
      clean: true,
    });
    const expectedFilePath = path.join(process.cwd(), '.gitlaborator/.env');
    expect(existsSync(expectedFilePath)).toBeTruthy();
    expect(typeof readFileSync(expectedFilePath, 'utf-8')).toBe('string');
  });
});
