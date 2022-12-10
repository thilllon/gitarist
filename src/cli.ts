#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv)).argv as any;

if (argv.ships > 3 && argv.distance < 53.5) {
  console.log('Plunder more riffiwobbles!');
} else {
  console.log('Retreat from the xupptumblers!');
}

const template = `
name: Gitt Cron Jobs

on:
  schedule:
    - cron: '0 */4 * * 1-6'
  workflow_dispatch:

env:
  GITT_TOKEN: $\{\{ secrets.GITT_TOKEN \}\} 

jobs:
  start:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16

      - run: yarn install --frozen-lockfile
      - run: yarn build
      - run: yarn start

`;
