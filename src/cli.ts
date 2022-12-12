#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import { mkdir, writeFileSync } from 'fs-extra';
import path from 'path';
import packageJson from '../package.json';
import { actionTemplate, envTemplate } from './gitarist.template';
import { runner } from './runner';

console.log(figlet.textSync(packageJson.name, { font: 'Slant' }));

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program
  .command('init')
  .description('initialize')
  .action(() => {
    const workflowDir = path.join(process.cwd(), '.github', 'workflows');
    mkdir(workflowDir, { recursive: true });

    writeFileSync(path.join(workflowDir, 'gitarist.yml'), actionTemplate, {
      encoding: 'utf8',
      flag: 'w+',
    });

    writeFileSync(path.join(workflowDir, '.env'), envTemplate, {
      encoding: 'utf8',
      flag: 'a+',
    });
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
