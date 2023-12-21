import {
  BaseRequestOptionsWithAccessToken,
  BaseResourceOptions,
} from '@gitbeaker/requester-utils';
import { Gitlab } from '@gitbeaker/rest';
import { existsSync, writeFileSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import path, { join } from 'path';

export class Gitlaborator {
  private readonly _token: string;
  private readonly _projectId: string;
  private readonly _options = {} as unknown as BaseResourceOptions<false>;

  constructor({
    projectId,
    options,
  }: {
    projectId?: string;
    options: BaseRequestOptionsWithAccessToken<false>;
  }) {
    this._options = options;
    this._token = options.token
      ? options.token.toString()
      : process.env.GITLAB_TOKEN;
    this._projectId = projectId ?? process.env.GITLAB_PROJECT_ID;

    if (!this._token) {
      throw new Error('Missing environment variable: "GITLAB_TOKEN"');
    }

    if (!this._projectId) {
      throw new Error('Missing environment variable: "GITLAB_PROJECT_ID"');
    }
  }

  async createEnvByProjectVariables({
    filename = '.env',
    directory = './.gitlaborator',
    clean = false,
  }: {
    /**
     * name of the file
     * @default .env
     */
    filename?: string;
    /**
     * relative path to the current working directory
     * @default ./.gitlaborator
     */
    directory?: string;
    /**
     * clean up the existing files
     * @default false
     */
    clean?: boolean;
  }) {
    const variables = await new Gitlab({
      ...this._options,
    }).ProjectVariables.all(this._projectId);

    if (!variables) {
      console.debug(`No variables found`);
      return;
    }

    const destination = join(process.cwd(), directory, filename);

    if (clean && existsSync(destination)) {
      await rm(destination, {
        force: true,
        recursive: true,
      }).catch(console.error);
    }

    await mkdir(path.dirname(destination), { recursive: true });

    const content = variables
      .map(({ key, value, description, variable_type }) => {
        let str = '';
        if (description) {
          str += `#${description}\n`;
        }
        if (variable_type === 'env_var') {
          str += `${key}="${value}"`;
        } else if (variable_type === 'file') {
          const absoluteDirectory = join(process.cwd(), directory);
          let envFilePath = join(absoluteDirectory, key);
          if (existsSync(envFilePath) && !clean) {
            envFilePath = join(absoluteDirectory, `${key}.${Date.now()}`);
          }
          writeFileSync(envFilePath, value, {
            encoding: 'utf-8',
            flag: 'w',
          });
        }
        return str;
      })
      .join('\n');

    writeFileSync(destination, content, { encoding: 'utf-8' });
  }
}
