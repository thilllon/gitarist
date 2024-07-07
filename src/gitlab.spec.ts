import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { Gitlaborator } from './gitlab';

jest.setTimeout(3600000);

describe.skip('gitlaborator', () => {
  dotenv.config({ path: '.env.test' });

  let gitlaborator: Gitlaborator;

  beforeAll(async () => {
    gitlaborator = new Gitlaborator({
      projectId: process.env.GITLAB_PROJECT_ID,
      options: {
        token: process.env.GITLAB_TOKEN,
        host: process.env.GITLAB_HOST,
      },
    });
  });

  it('should be defined', async () => {
    expect(
      new Gitlaborator({
        projectId: process.env.GITLAB_PROJECT_ID,
        options: {
          token: process.env.GITLAB_TOKEN,
        },
      }),
    ).toBeDefined();
  });

  it('createEnvByProjectVariables', async () => {
    await gitlaborator.createDotEnvFileByProjectVariables({
      clean: true,
    });
    const expectedFilePath = path.join(process.cwd(), '.gitlaborator/.env');
    expect(existsSync(expectedFilePath)).toBeTruthy();
    expect(typeof readFileSync(expectedFilePath, 'utf-8')).toBe('string');
  });

  it('findCommentsByAuthor', async () => {
    const mergeRequestIid = 1673;

    const comments = await gitlaborator.findCommentsByAuthor({ mergeRequestIid });
    expect(comments).toBeDefined();
  });
});
