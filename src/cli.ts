#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import { mkdir, readFileSync, writeFileSync } from 'fs-extra';
import path from 'path';
import { runner } from './runner';

figlet.textSync('Gitarist');

const program = new Command();

program
  .name('gitarist')
  .description('CLI to some JavaScript string utilities')
  .version('0.8.0');

program
  .command('init')
  .description('setup a cron job')
  .action(() => {
    const workflowDir = path.join(process.cwd(), '.github', 'workflows');
    mkdir(workflowDir, { recursive: true });

    const actionTemplate = readFileSync(
      path.join(process.cwd(), 'templates', 'gitarist.yml'),
      { encoding: 'utf8' }
    );
    writeFileSync(path.join(workflowDir, 'gitarist.yml'), actionTemplate, {
      encoding: 'utf8',
      flag: 'w+',
    });

    const envTemplate = readFileSync(
      path.join(__dirname, '.env.example'),
      'utf8'
    );
    writeFileSync(path.join(workflowDir, '.env.example'), envTemplate, {
      encoding: 'utf8',
      flag: 'w+',
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
