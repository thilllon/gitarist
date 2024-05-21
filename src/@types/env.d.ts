declare module NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';

    GITHUB_OWNER: string;
    GITHUB_REPO: string;
    GITHUB_TOKEN: string;

    GITLAB_HOST: string;
    GITLAB_PROJECT_ID: string;
    GITLAB_TOKEN: string;

    VERCEL_PROJECT_ID: string;
    VERCEL_TOKEN: string;

    JIRA_TOKEN: string;
    JIRA_HOST: string;
    JIRA_PROJECT_KEY: string;
  }
}
