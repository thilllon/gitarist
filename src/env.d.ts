/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
declare module NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    GITT_TOKEN: string;
    GITT_OWNER: string;
    GITT_REPO: string;
  }
}
