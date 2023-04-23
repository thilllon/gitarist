import { GitaristRunner } from './gitarist-runner';

console.log('Gitarist: development mode');

const runner = new GitaristRunner();

// runner.runImitateActiveUser({});

runner.runListRepositories({});

// runner.runDeleteRepositoryList({});

// runner.runListBranches({ ref: 'commits/*' });
