# Gitarist

To proved that Github green grass("planting grass") means nothing

[![npm version](https://badge.fury.io/js/gitt-cli.svg)](https://badge.fury.io/js/gitt-cli)

- Multiple useful Github utilities based on `Octokit`
- Auto commit, auto cleaning stale workflows, auto cleaning dummy files etc.
- Run cron job using `Github Action`

## How to use

1. create a secret

   https://github.com/settings/tokens/new?description=GITARIST_TOKEN&scopes=repo,read:packages,read:org,delete_repo

2. set the secret to the target repository

   Go to setting page and set secret as `GITARIST_TOKEN`

   https://github.com/{OWNER}/{REPO}/settings/secrets/actions

   Make sure that you are the owner of the target repository.

3. initialize Gitarist and check `./.github/workflows/gitarist.yml`

   ```sh
   npx gitarist@latest init
   ```

## How to contribute this project

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

## How to make a clean git history

```sh
# interactive rebase and squash all except root commit
# or, git rebase -i HEAD~11
git rebase -i --root

git push origin --force main
```

## clean PR history

```sh
git config pull.rebase true

git pull --prune

git branch -r | grep --only "commit\/167.*" | xargs git push origin --delete

git pull --prune
```
