#!/usr/bin/env node

import { Command, Option } from 'commander';
import dotenv from 'dotenv';
import z from 'zod';
import { description, name, version } from '../package.json';
import {
  DEFAULT,
  Gitarist,
  SetupCommandOptions,
  StartCommandOptions,
  branchPrefixes,
} from './github';
import { CreateEnvExampleOptions, createEnvExample } from './libs';

const program = new Command().name(name).description(description).version(version);

program
  .command('setup')
  .description(
    'It sets up gitarist suite. It will create a new GitHub workflow file and `.env` file, adds environment variables to .env file, and opens a browser to create a new GitHub token.',
  )
  .addOption(new Option('--remote <string>', 'the name of remote').default(DEFAULT.remote))
  .action(async (options: SetupCommandOptions) => {
    await Gitarist.setup({ remote: options.remote });
  });

program
  .command('start')
  .description(
    'It starts gitarist suite. It simulates an active user on a GitHub repository to create issues, commits, create a pull request, and merge it.',
  )
  .addOption(new Option('-o,--owner <string>', 'Repository owner').env('GITHUB_OWNER'))
  .addOption(new Option('-r,--repo <string>', 'GitHub repository').env('GITHUB_REPO'))
  .addOption(
    new Option(
      '-t,--token <string>',
      `GitHub access token issued at ${Gitarist.tokenIssueUrl}`,
    ).env('GITHUB_TOKEN'),
  )
  .addOption(
    new Option('--max-commits <number>', 'Maximum number of commits per PR').default(
      DEFAULT.maxCommits,
    ),
  )
  .addOption(
    new Option('--min-commits <number>', 'Minimum number of commits per PR').default(
      DEFAULT.minCommits,
    ),
  )
  .addOption(
    new Option('--max-files <number>', 'Maximum number of files per commit').default(
      DEFAULT.maxFiles,
    ),
  )
  .addOption(
    new Option('--min-files <number>', 'Minimum number of files per commit').default(
      DEFAULT.minFiles,
    ),
  )
  .addOption(
    new Option('--issues <number>', 'A number of issues to create').default(DEFAULT.numberOfIssues),
  )
  .addOption(
    new Option('--working-branch-prefix <string>', 'Prefix for working branches')
      .choices(branchPrefixes)
      .default(DEFAULT.workingBranchPrefix),
  )
  .addOption(new Option('-m,--main-branch <string>', 'Main branch').default(DEFAULT.mainBranch))
  .addOption(
    new Option('--stale <days>', 'A number of days before closing an issue').default(DEFAULT.stale),
  )
  .action(async (options: Partial<StartCommandOptions>) => {
    ['.env'].forEach((file) => {
      dotenv.config({ path: file });
    });

    options = {
      ...options,
      owner: options.owner ?? process.env.GITHUB_OWNER,
      repo: options.repo ?? process.env.GITHUB_REPO,
      token: options.token ?? process.env.GITHUB_TOKEN,
    };

    console.log(process.env.GITHUB_OWNER);
    console.log(process.env.GITHUB_REPO);

    const validOptions = z
      .object({
        owner: z.string().min(2),
        repo: z.string().min(1),
        token: z.string().min(1),
        minCommits: z.coerce
          .number()
          .min(1)
          .refine((arg) => arg <= Number(options.maxCommits), {
            message: 'minCommits must be less than or equal to maxCommits',
          }),
        maxCommits: z.coerce.number().min(1),
        minFiles: z.coerce
          .number()
          .min(1)
          .refine((arg) => arg <= Number(options.maxFiles), {
            message: 'minFiles must be less than or equal to maxFiles',
          }),
        maxFiles: z.coerce.number().min(1),
        issues: z.coerce.number().min(1),
        workingBranchPrefix: z.enum(branchPrefixes),
        mainBranch: z.string().min(1),
        stale: z.coerce.number().min(1),
      })
      .parse(options);

    const gitarist = new Gitarist({
      owner: validOptions.owner,
      repo: validOptions.repo,
      token: validOptions.token,
    });
    await gitarist.simulateActiveUser({
      mainBranch: validOptions.mainBranch,
      maxCommits: validOptions.maxCommits,
      maxFiles: validOptions.maxFiles,
      minCommits: validOptions.minCommits,
      minFiles: validOptions.minFiles,
      numberOfIssues: validOptions.issues,
      workingBranchPrefix: validOptions.workingBranchPrefix,
      stale: validOptions.stale,
    });
  });

program
  .command('env-example')
  .description('Create an example of .env file based on the current .env file(s)')
  .addOption(
    new Option(
      '-f,--filename <string>',
      'Read given env file such as .env.local, .env.test etc.',
    ).default('.env'),
  )
  .addOption(new Option('-c,--comments', 'Preserve comments').default(true))
  .addOption(new Option('-m,--merge', 'Merge all env files into one').default(true))
  .action(async (options: CreateEnvExampleOptions) => {
    const validOptions = z
      .object({
        comments: z.boolean(),
        filename: z
          .string()
          .min(1)
          .refine((arg) => arg !== '.env.example', {
            message: 'filename should not be .env.example',
          }),
        merge: z.boolean(),
      })
      .parse(options);
    await createEnvExample(validOptions);
  });

program.parse();
