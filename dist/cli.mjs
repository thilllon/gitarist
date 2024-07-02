#!/usr/bin/env node
import { __esm, __commonJS, init_github, DEFAULT, Gitarist, branchPrefixes } from './chunk-UEFSHEOX.mjs';
import fs from 'fs';
import path from 'path';
import { Command, Option } from 'commander';
import dotenv from 'dotenv';
import z from 'zod';

// package.json
var name, version, description;
var init_package = __esm({
  "package.json"() {
    name = "gitarist";
    version = "1.2.10";
    description = "A CLI tool to utilize Octokit";
  }
});
async function createEnvExample(options) {
  const keySet = /* @__PURE__ */ new Set();
  const output = fs.readFileSync(path.join(process.cwd(), options.filename), "utf8").split("\r").join("").split("\n").map((line) => line.trim()).map((line, index) => {
    if (line === "") {
      return "";
    }
    if (line.startsWith("#")) {
      return options.comments ? line : null;
    }
    if (line.indexOf("=") === -1) {
      throw new Error(`Line ${index} does not have a valid config (i.e. no equals sign).`);
    }
    const key = line.split("=")[0];
    if (options.merge && keySet.has(key)) {
      return null;
    } else {
      keySet.add(key);
      return key + "=";
    }
  }).filter((line) => line !== null).join("\n");
  fs.writeFileSync(path.join(process.cwd(), ".env.example"), output, {
    encoding: "utf-8",
    flag: "w+"
  });
  console.log("\u2728 .env.example successfully generated.");
}
var init_env_example = __esm({
  "src/libs/env-example.ts"() {
  }
});

// src/libs/index.ts
var init_libs = __esm({
  "src/libs/index.ts"() {
    init_env_example();
  }
});
var require_cli = __commonJS({
  "src/cli.ts"() {
    init_package();
    init_github();
    init_libs();
    var program = new Command().name(name).description(description).version(version);
    program.command("setup").description(
      "It sets up gitarist suite. It will create a new GitHub workflow file and `.env` file, adds environment variables to .env file, and opens a browser to create a new GitHub token."
    ).addOption(new Option("--remote <string>", "the name of remote").default(DEFAULT.remote)).action(async (options) => {
      await Gitarist.setup({ remote: options.remote });
    });
    program.command("start").description(
      "It starts gitarist suite. It simulates an active user on a GitHub repository to create issues, commits, create a pull request, and merge it."
    ).addOption(new Option("-o,--owner <string>", "Repository owner").env("GITHUB_OWNER")).addOption(new Option("-r,--repo <string>", "GitHub repository").env("GITHUB_REPO")).addOption(
      new Option(
        "-t,--token <string>",
        `GitHub access token issued at ${Gitarist.tokenIssueUrl}`
      ).env("GITHUB_TOKEN")
    ).addOption(
      new Option("--max-commits <number>", "Maximum number of commits per PR").default(
        DEFAULT.maxCommits
      )
    ).addOption(
      new Option("--min-commits <number>", "Minimum number of commits per PR").default(
        DEFAULT.minCommits
      )
    ).addOption(
      new Option("--max-files <number>", "Maximum number of files per commit").default(
        DEFAULT.maxFiles
      )
    ).addOption(
      new Option("--min-files <number>", "Minimum number of files per commit").default(
        DEFAULT.minFiles
      )
    ).addOption(
      new Option("--issues <number>", "A number of issues to create").default(DEFAULT.numberOfIssues)
    ).addOption(
      new Option("--working-branch-prefix <string>", "Prefix for working branches").choices(branchPrefixes).default(DEFAULT.workingBranchPrefix)
    ).addOption(new Option("-m,--main-branch <string>", "Main branch").default(DEFAULT.mainBranch)).addOption(
      new Option("--stale <days>", "A number of days before closing an issue").default(DEFAULT.stale)
    ).action(async (options) => {
      [".env"].forEach((file) => {
        dotenv.config({ path: file });
      });
      options = {
        ...options,
        owner: options.owner ?? process.env.GITHUB_OWNER,
        repo: options.repo ?? process.env.GITHUB_REPO,
        token: options.token ?? process.env.GITHUB_TOKEN
      };
      const validOptions = z.object({
        owner: z.string().min(2),
        repo: z.string().min(1),
        token: z.string().min(1),
        minCommits: z.coerce.number().min(1).refine((arg) => arg <= Number(options.maxCommits), {
          message: "minCommits must be less than or equal to maxCommits"
        }),
        maxCommits: z.coerce.number().min(1),
        minFiles: z.coerce.number().min(1).refine((arg) => arg <= Number(options.maxFiles), {
          message: "minFiles must be less than or equal to maxFiles"
        }),
        maxFiles: z.coerce.number().min(1),
        issues: z.coerce.number().min(1),
        workingBranchPrefix: z.enum(branchPrefixes),
        mainBranch: z.string().min(1),
        stale: z.coerce.number().min(1)
      }).parse(options);
      const gitarist = new Gitarist({
        owner: validOptions.owner,
        repo: validOptions.repo,
        token: validOptions.token
      });
      await gitarist.simulateActiveUser({
        mainBranch: validOptions.mainBranch,
        maxCommits: validOptions.maxCommits,
        maxFiles: validOptions.maxFiles,
        minCommits: validOptions.minCommits,
        minFiles: validOptions.minFiles,
        numberOfIssues: validOptions.issues,
        workingBranchPrefix: validOptions.workingBranchPrefix,
        stale: validOptions.stale
      });
    });
    program.command("env-example").description("Create an example of .env file based on the current .env file(s)").addOption(
      new Option(
        "-f,--filename <string>",
        "Read given env file such as .env.local, .env.test etc."
      ).default(".env")
    ).addOption(new Option("-c,--comments", "Preserve comments").default(true)).addOption(new Option("-m,--merge", "Merge all env files into one").default(true)).action(async (options) => {
      const validOptions = z.object({
        comments: z.boolean(),
        filename: z.string().min(1).refine((arg) => arg !== ".env.example", {
          message: "filename should not be .env.example"
        }),
        merge: z.boolean()
      }).parse(options);
      await createEnvExample(validOptions);
    });
    program.parse();
  }
});
var cli = require_cli();

export { cli as default };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=cli.mjs.map