# Gitarist

To proved that Github green grass("planting grass") means nothing

[![npm version ](https://img.shields.io/npm/v/gitarist)](https://img.shields.io/npm/v/gitarist)
[![npm bundle size](https://img.shields.io/bundlephobia/min/gitarist)](https://img.shields.io/bundlephobia/min/gitarist)
[![npm download](https://img.shields.io/npm/dw/gitarist)](https://img.shields.io/npm/dw/gitarist)

- Multiple useful Github utilities based on `Octokit`
- Auto commit, auto cleaning stale workflows, auto cleaning dummy files etc.
- Run cron job using `Github Action`

## Basic Usage

1. Create a secret
   Permission to `repo` must be inluded to control workflow

   https://github.com/settings/tokens/new?description=GITARIST_TOKEN&scopes=repo,read:packages,read:org,delete_repo,workflow

2. Set the secret to the target repository

   Go to setting page and set secret as `GITARIST_TOKEN`

   https://github.com/{OWNER}/{REPO}/settings/secrets/actions

   Make sure that you are the owner of the target repository.

3. Initialize Gitarist and check `./.github/workflows/gitarist.yml`

   ```sh
   npx gitarist init
   ```

## Make git history clean

```sh
# interactive rebase and squash all except root commit
git rebase -i --root # or, git rebase -i HEAD~11
git push origin --force main
```

## Make PR history clean

```sh
git config pull.rebase true && git pull --prune && git branch -r | grep --only "commit\/167.*" | xargs git push --delete origin && git pull --prune
# git push --delete origin SOME_TAG_NAME
# git tag --delete SOME_TAG_NAME
```

## Contributing

Rename `.env.example` to `.env` and fill the environment values by following instructions.

```sh
# install dependencies
pnpm

# development
pnpm dev

# production
pnpm build
pnpm start
```
