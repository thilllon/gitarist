declare module NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    GITARIST_OWNER: string;
    GITARIST_REPO: string;
    GITARIST_TOKEN: string;
  }
}
