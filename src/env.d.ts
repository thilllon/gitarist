declare module NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';

    GITARIST_OWNER: string;
    GITARIST_REPO: string;
    GITARIST_TOKEN: string;

    GITLAB_PROJECT_ID: string;
    GITLAB_TOKEN: string;

    VERCEL_PROJECT_ID: string;
    VERCEL_TOKEN: string;
  }
}
