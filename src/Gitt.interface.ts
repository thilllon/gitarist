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
  staleTimeMs: number;
  searchingPaths?: string[];
};

export type CreateCommitsOptions = {
  repo: string;
  owner: string;
  branch: string;
  numFiles?: number;
  numCommits?: number;
  removeOptions: RemoveStaleFilesOptions;
};

export type CreateFilesOptions = {
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

export type CreatePullRequestOptions = {
  owner: string;
  repo: string;
  dirName: string;
};

// --------------------------------
// --------------------------------

// TODO: @octokit/type 값으로 변경하기
export type User__ = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
};

// TODO: @octokit/type 값으로 변경하기
export type Repository__ = {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: User__;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
};

// TODO: @octokit/type 값으로 변경하기
export type PullRequest__ = any;

export type Run__ = {
  id: number;
  name: string;
  node_id: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  event: string;
  status: string;
  conclusion: string;
  workflow_id: number;
  check_suite_id: number;
  check_suite_node_id: string;
  url: string;
  html_url: string;
  pull_requests: PullRequest__[];
  created_at: string;
  updated_at: string;
  actor: User__;
  run_attempt: 1;
  run_started_at: string;
  triggering_actor: User__;
  jobs_url: string;
  logs_url: string;
  check_suite_url: string;
  artifacts_url: string;
  cancel_url: string;
  rerun_url: string;
  previous_attempt_url: string | null;
  workflow_url: string;
  head_commit: {
    id: string;
    tree_id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
    committer: {
      name: string;
      email: string;
    };
  };
  repository: Repository__;
  head_repository: Repository__;
};

export type Conclusion__ =
  | 'action_required'
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'success'
  | 'skipped'
  | 'stale'
  | 'timed_out';
