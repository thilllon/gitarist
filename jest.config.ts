import type { Config } from 'jest';

const config: Config = {
  transform: {
    '^.+\\.(t|j)s?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: false,
};

export default config;
