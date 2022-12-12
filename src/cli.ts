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
  // .argument('<string>', 'string to split')
  // .option('--first', 'display just the first substring')
  // .option('-s, --separator <char>', 'separator character', ',')
  .action(() => {
    // const limit = options.first ? 1 : undefined;
    // console.log(str.split(options.separator, limit));

    const dir = path.join(process.cwd(), '.github', 'workflows');
    mkdir(dir, { recursive: true });
    const actionTemplate = readFileSync(
      path.join(process.cwd(), 'src', 'templates', 'gitarist.yml'),
      { encoding: 'utf8' }
    );
    writeFileSync(path.join(dir, 'gitarist.yml'), actionTemplate, {
      encoding: 'utf8',
      flag: 'w+',
    });

    const envTemplate = readFileSync(
      path.join(__dirname, '.env.example'),
      'utf8'
    );
    writeFileSync(path.join(dir, '.env.example'), envTemplate, {
      encoding: 'utf8',
      flag: 'w+',
    });
  });

program
  .command('commit')
  .description('commit')
  .option('-t,--token <string>', 'github token')
  .option('-o,--owner <string>', 'github owner')
  .option('-r,--repo <string>', 'github repo')
  .action((options) => {
    process.env.GITARIST_TOKEN = options.token;
    process.env.GITARIST_OWNER = options.owner;
    process.env.GITARIST_REPO = options.repo;
    // console.log(options);
    // console.log(process.env.GITARIST_TOKEN);
    // console.log(process.env.GITARIST_OWNER);
    // console.log(process.env.GITARIST_REPO);
    runner();
  });

program.parse();
