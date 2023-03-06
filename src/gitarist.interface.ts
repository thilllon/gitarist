export interface RemoveStaleFilesOptions {
  staleTimeMs: number;
  searchingPaths?: string[];
}

export type NumberOrRange = number | { min: number; max: number };

export interface CreateCommitsOptions {
  repo: string;
  owner: string;
  branch: string;
  numFiles?: NumberOrRange;
  numCommits?: NumberOrRange;
  subpath?: string;
  removeOptions: RemoveStaleFilesOptions;
}

export interface CreateFilesOptions {
  numFiles: number;
  directory?: string;
  verbose?: boolean;
}

export interface CreateIssuesOptions {
  repo: string;
  owner: string;
  numIssues?: number;
}

export interface CloseIssuesOptions {
  repo: string;
  owner: string;
  staleTimeMs: number;
}

export interface ListRepositoriesOptions {
  owner: string;
  reposLogPath?: string;
  ownerLogin?: string;
  rawLogPath?: string;
}

export interface FindWastedActionsOptions {
  owner: string;
}

export interface DeleteRepoWorkflowLogsOptions {
  repo: string;
  owner: string;
  staleTimeMs: number;
}

export interface CreatePullRequestOptions {
  owner: string;
  repo: string;
  head?: string;
  headPrefix?: string;
  subpath?: string;
}

export interface RemoveCommentsOnIssueByBotOptions {
  owner: string;
  repo: string;
}

export interface ChangeIssueTitleAndAddLabelsOptions {
  owner: string;
  repo: string;
  changeTitle?: boolean;
}

export interface DeleteReposOptions {
  owner: string;
  repos?: string[];
  targetPath?: string;
  deleteLogPath?: string;
}

export interface MimicPullRequestOptions {
  owner: string;
  repo: string;
  subpath?: string;
  reviewOptions: ReviewOptions;
}

export interface ReviewOptions {
  content?: string;
}

// TODO: @octokit/type 값으로 변경하기
/**
 * Parameters for create a commit
 * @reference https://docs.github.com/en/rest/git/commits#create-a-commit
 * @reference https://octokit.github.io/rest.js/v19/#git-create-tree
 */
export interface TreeParam {
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
}

// TODO: @octokit/type 값으로 변경하기
export interface __Workflow {
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
}

// TODO: @octokit/type 값으로 변경하기
export interface __User {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
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
}

// TODO: @octokit/type 값으로 변경하기
export interface __Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: __User;
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
}

// TODO: @octokit/type 값으로 변경하기
export type __PullRequest = any;

// TODO: @octokit/type 값으로 변경하기
export interface __Run {
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
  pull_requests: __PullRequest[];
  created_at: string;
  updated_at: string;
  actor: __User;
  run_attempt: 1;
  run_started_at: string;
  triggering_actor: __User;
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
  repository: __Repository;
  head_repository: __Repository;
}

// TODO: @octokit/type 값으로 변경하기
export type __Conclusion =
  | 'action_required'
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'success'
  | 'skipped'
  | 'stale'
  | 'timed_out';
