import { __commonJS, init_github, Gitarist, DEFAULT } from './chunk-UEFSHEOX.mjs';

// src/github-action.ts
var require_github_action = __commonJS({
  "src/github-action.ts"() {
    init_github();
    async function main() {
      const owner = process.env.GITHUB_OWNER;
      const repo = process.env.GITHUB_REPO;
      const token = process.env.GITHUB_TOKEN;
      if (!owner) {
        throw new Error("Check your environment variables. GITHUB_OWNER is missing");
      }
      if (!repo) {
        throw new Error("Check your environment variables. GITHUB_REPO is missing");
      }
      if (!token) {
        throw new Error("Check your environment variables. GITHUB_TOKEN is missing");
      }
      const gitarist = new Gitarist({ owner, repo, token });
      await gitarist.simulateActiveUser({
        mainBranch: DEFAULT.mainBranch,
        maxCommits: DEFAULT.maxCommits,
        maxFiles: DEFAULT.maxFiles,
        minCommits: DEFAULT.minCommits,
        minFiles: DEFAULT.minFiles,
        numberOfIssues: DEFAULT.numberOfIssues,
        workingBranchPrefix: DEFAULT.workingBranchPrefix,
        stale: DEFAULT.stale
      });
    }
    main();
  }
});
var githubAction = require_github_action();

export { githubAction as default };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=github-action.mjs.map