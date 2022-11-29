// TODO: Octokit에서 제공하는 타입을 사용하도록 변경
export type Workflow = {
  id: number;
  node_id: string;
  name: string;
  path: string;
  state:
    | 'active'
    | 'deleted'
    | 'disabled_fork'
    | 'disabled_inactivity'
    | 'disabled_manually';
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
  deleted_at?: string | undefined;
};

/**
 * Parameters for create a commit
 * @reference https://docs.github.com/en/rest/git/commits#create-a-commit
 * @reference https://octokit.github.io/rest.js/v19/#git-create-tree
 */
export type TreeParam = {
  path: string;
  /**
   * 100644 for file (blob)
   * 100755 for executable (blob)
   * 040000 for subdirectory (tree)
   * 160000 for submodule (commit)
   * 120000 for a blob
   */
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha: string;
};

export type RemoveStaleFilesOptions = {
  staleTimeInSeconds: number;
};

export type CreateCommitsOptions = {
  repo: string;
  owner: string;
  branch: string;
  numFiles?: number;
  relPath?: string;
  numCommits?: number;
  removeOptions: RemoveStaleFilesOptions;
};

export type CreateFilesOptions = {
  relPath: string;
  numFiles: number;
};

export type CreateIssuesOptions = {
  repo: string;
  owner: string;
  numIssues?: number;
};

export type CloseIssuesOptions = {
  repo: string;
  owner: string;
  staleTimeInSeconds: number;
};

export type ListRepositoriesOptions = {
  owner: string;
  jsonFile: string;
};

export type DeleteReposOptions = {
  owner: string;
  jsonFile: string;
};

export type FindWastedActionsOptions = {
  owner: string;
};

export type DeleteRepoWorkflowLogsOptions = {
  repo: string;
  owner: string;
  staleTimeInSeconds: number;
};
