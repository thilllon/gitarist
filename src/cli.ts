#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import figlet from 'figlet';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import packageJson from '../package.json';
import {
  actionTemplate,
  envTemplate,
  getPackageJsonTemplate,
  getReadmeTemplate,
} from './gitarist.template';
import { runner } from './runner';

console.log(figlet.textSync(packageJson.name, { font: 'Slant' }));

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program
  .command('generate')
  .alias('g')
  .description('generate gitarist project')
  .argument('[dir]', 'directory to create [default: .]', '.')
  .action(async (dir = '.') => {
    initCmd(dir);

    writeFileSync(
      path.join(process.cwd(), dir, 'package.json'),
      getPackageJsonTemplate(dir)
    );
    writeFileSync(
      path.join(process.cwd(), dir, 'README.md'),
      getReadmeTemplate(dir)
    );

    console.log(
      `\nCreated at ` + chalk.greenBright.bold(path.join(process.cwd(), dir))
    );
  });

const initCmd = (dir = '') => {
  const workflowDir = path.join(process.cwd(), dir, '.github', 'workflows');
  mkdirSync(workflowDir, { recursive: true });

  writeFileSync(path.join(workflowDir, 'gitarist.yml'), actionTemplate, {
    encoding: 'utf8',
    flag: 'w+',
  });

  writeFileSync(path.join(process.cwd(), dir, '.env'), envTemplate, {
    encoding: 'utf8',
    flag: 'a+',
  });

  console.log(`\nGenerate a secret key settings:`);
  console.log(
    chalk.greenBright.bold(
      `https://github.com/settings/tokens/new?description=GITARIST_TOKEN&scopes=repo,read:packages,read:org,delete_repo,workflow`
    )
  );

  console.log(`\nRegister the secret key to action settings:`);
  console.log(
    chalk.greenBright.bold(`https://github.com/<USERNAME>/${dir}/settings/new`)
  );
};

program
  .command('init')
  .description('initialize')
  .action(() => {
    initCmd();
  });

program
  .command('run')
  .description('run gitarist suite')
  .option('-t,--token <string>', 'github token')
  .option('-o,--owner <string>', 'github owner')
  .option('-r,--repo <string>', 'github repo')
  .action((options) => {
    process.env.GITARIST_TOKEN = options.token;
    process.env.GITARIST_OWNER = options.owner;
    process.env.GITARIST_REPO = options.repo;

    if (!process.env.GITARIST_TOKEN) {
      throw new Error(
        'Missing required environment variables: "GITARIST_TOKEN"'
      );
    }
    if (!process.env.GITARIST_OWNER) {
      throw new Error(
        'Missing required environment variables: "GITARIST_OWNER"'
      );
    }
    if (!process.env.GITARIST_REPO) {
      throw new Error(
        'Missing required environment variables: "GITARIST_REPO"'
      );
    }

    runner();
  });

program.parse();
