#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import { mkdir, writeFileSync } from 'fs-extra';
import path from 'path';

figlet.textSync('Gitt');

const template = ` 
name: Gitt Cron Jobs

on:
  schedule:
    # cron for every day 8hours except sunday
    - cron: '0 */4 * * 1-6'
  workflow_dispatch:

env:
  GITT_TOKEN: \${{ secrets.GITT_TOKEN }} 

jobs:
  start:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - uses: pnpm/action-setup@v2
        with:
          version: 7
          run_install: false

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        # run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT
        run: echo "::set-output name=STORE_PATH::$(pnpm store path)"

      - uses: actions/cache@v3
        with:
          path: \${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: \${{ runner.os }}-pnpm-store-\${{ hashFiles('**/pnpm-lock.yaml') }} 
          restore-keys: |
            \${{ runner.os }}-pnpm-store- 

      - run: pnpm install
      - run: pnpm build
      - run: pnpm start

`;

const program = new Command();

program
  .name('gitt')
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
    writeFileSync(path.join(dir, 'gitt.yml'), template, {
      encoding: 'utf8',
      flag: 'w+',
    });
  });

program.parse();
