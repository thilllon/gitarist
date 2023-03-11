import { GitaristRunner } from './gitarist.runner';

console.log('Gitarist: development mode');

const runner = new GitaristRunner();

// runner.runImitateActiveUser({});

runner.runListRepository({});

// runner.runDeleteRepositoryList({});

// runner.runListBranches({ ref: 'commits/*' });
