import { Octokit } from 'octokit';

declare const branchPrefixes: readonly ["feature", "hotfix"];
declare const workflowStatus: string[];
declare const commitCategories: readonly ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"];
declare const DEFAULT: {
    readonly maxCommits: 3;
    readonly minCommits: 1;
    readonly maxFiles: 4;
    readonly minFiles: 1;
    readonly numberOfIssues: 2;
    readonly workingBranchPrefix: "feature";
    readonly mainBranch: "main";
    readonly relativePath: ".gitarist";
    readonly remote: "origin";
    readonly cron: "0 */6 * * 0-6";
    readonly stale: 2;
    readonly language: "GO";
    readonly ownerPlaceholder: "<OWNER>";
    readonly repoPlaceholder: "<REPOSITORY>";
};
declare enum MODE {
    BLOB = "120000",
    BLOB__FILE = "100644",
    BLOB__EXECUTABLE = "100755",
    TREE__DIRECTORY = "040000",
    COMMIT__SUBMODULE = "160000"
}
type Language = 'GO' | 'PYTHON' | 'JAVA' | 'CPP' | 'TEXT';
type SetupCommandOptions = {
    remote: string;
};
type StartCommandOptions = {
    owner: string;
    repo: string;
    token: string;
} & {
    minCommits: number;
    maxCommits: number;
    minFiles: number;
    maxFiles: number;
    issues: number;
    workingBranchPrefix: BranchPrefix;
    mainBranch: MainBranch;
    stale: number;
};
type BranchPrefix = (typeof branchPrefixes)[number];
type MainBranch = 'main' | 'master' | string;
type TreeParam = {
    path?: string | undefined;
    mode?: MODE;
    type?: 'blob' | 'tree' | 'commit' | undefined;
    sha?: string | undefined;
    content?: string | undefined;
};
type IssueItem = {
    title: string;
    body: string;
    assignee?: string;
    labels?: string;
};
declare class Gitarist {
    private readonly _octokit;
    private readonly _owner;
    private readonly _repo;
    private readonly _token;
    private readonly labelsCandidates;
    private assigneeCandidates;
    private languageMap;
    constructor({ owner, repo, token }: {
        owner: string;
        repo: string;
        token: string;
    });
    get owner(): string;
    get repo(): string;
    get octokit(): Octokit;
    static get logo(): string;
    static get tokenIssueUrl(): string;
    static getEnvSettingPageUrl({ owner, repo }: {
        owner: string;
        repo: string;
    }): string;
    static getActionTemplate({ cron, repo, owner, }: {
        cron?: string;
        repo?: string;
        owner?: string;
    }): string;
    static getEnvTemplate({ owner, repo, token }: {
        owner?: string | undefined;
        repo?: string | undefined;
        token?: string | undefined;
    }): string;
    static setup({ remote }: Partial<SetupCommandOptions>): Promise<void>;
    simulateActiveUser({ maxCommits, minCommits, maxFiles, minFiles, numberOfIssues, workingBranchPrefix, mainBranch, stale, language, }: {
        maxCommits?: number;
        minCommits?: number;
        maxFiles?: number;
        minFiles?: number;
        numberOfIssues?: number;
        workingBranchPrefix?: BranchPrefix;
        mainBranch?: MainBranch;
        stale?: number;
        language?: Language;
    }): Promise<void>;
    closeStaleIssues({ olderThan }: {
        olderThan: Date;
    }): Promise<void>;
    deleteOldIssues({ olderThan }: {
        olderThan: Date;
    }): Promise<void>;
    listBranches({ ref }: {
        ref: string;
    }): Promise<{
        ref: string;
        node_id: string;
        url: string;
        object: {
            type: string;
            sha: string;
            url: string;
        };
    }[]>;
    deleteBranches({ ref, mainBranch, }: {
        ref: string;
        mainBranch?: MainBranch;
    }): Promise<void>;
    deleteFolder({ folderPaths, relative, }: {
        folderPaths: string[];
        relative?: boolean;
    }): Promise<void>;
    deleteCommentsAtIssueByBot(): Promise<void>;
    deleteOldFiles({ olderThan, mainBranch, }: {
        olderThan: Date;
        mainBranch?: MainBranch;
    }): Promise<void>;
    createIssuesFromJson({ relativePath }: {
        relativePath: string;
    }): Promise<void>;
    createMultipleIssues({ issueItems }: {
        issueItems: IssueItem[];
    }): Promise<void>;
    findWastedActionsOverAllRepositories(): Promise<void>;
    resolveAllReviewComments(): Promise<string[]>;
    changePullRequestData(): Promise<void>;
    deleteOldWorkflowLogs({ olderThan }: {
        olderThan: Date;
    }): Promise<void>;
    private createCommitAndMakePullRequest;
    private validateIssueTemplate;
    private createPullRequestAndReviewAndMerge;
    private createFiles;
}

export { type BranchPrefix, DEFAULT, Gitarist, type IssueItem, type Language, type MainBranch, type SetupCommandOptions, type StartCommandOptions, type TreeParam, branchPrefixes, commitCategories, workflowStatus };
