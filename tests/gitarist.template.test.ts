import { beforeAll, describe, expect, test } from '@jest/globals';
import { cosmiconfigSync } from 'cosmiconfig';
import dotenv from 'dotenv';
import prettier from 'prettier';
import { Templates } from '../src/gitarist-template';

describe('should be able to generate templates', () => {
  let prettierConfig: Record<string, unknown>;

  beforeAll(async () => {
    const explorerSync = cosmiconfigSync('prettier');
    const result = explorerSync.search();
    prettierConfig = result ? result.config : {};
  });

  test('getActionTemplate', async () => {
    const template = Templates.getActionTemplate();
    expect(typeof template).toBe('string');
    expect(template).toBe(
      prettier.format(template, { ...prettierConfig, parser: 'yaml' })
    );
  });

  test('getEnvTemplate', async () => {
    const template = Templates.getEnvTemplate();
    expect(typeof template).toBe('string');
    // TOOD: what is suitable parser for .env file?
    // expect(template).toBe(prettier.format(template, { ...prettierConfig }));

    const keys = ['GITARIST_TOKEN', 'GITARIST_OWNER', 'GITARIST_REPO'] as const;
    const buf = Buffer.from(template);
    const config = dotenv.parse(buf);
    expect(config).toBeDefined();
    expect(config[keys[0]]).toBe('');
    expect(config[keys[1]]).toBe('');
    expect(config[keys[2]]).toBe('');
  });

  test('getPackageJsonTemplate', async () => {
    const template = Templates.getPackageJsonTemplate('test');
    expect(typeof template).toBe('string');
    expect(template).toBe(
      prettier.format(template, { ...prettierConfig, parser: 'json' })
    );
  });

  test('getReadmeTemplate', async () => {
    const template = Templates.getReadmeTemplate('test');
    expect(typeof template).toBe('string');
    expect(template).toBe(prettier.format(template, { parser: 'markdown' }));
  });
});
