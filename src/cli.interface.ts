export type BaseOptions = {
  owner: string;
  repo: string;
  token: string;
};

export type RunOptions = BaseOptions & {
  minCommits: number;
  maxCommits: number;
  minFiles: number;
  maxFiles: number;
};
