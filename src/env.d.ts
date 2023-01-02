/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
declare module NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    GITARIST_OWNER: string;
    GITARIST_REPO: string;
    GITARIST_TOKEN: string;
  }
}
