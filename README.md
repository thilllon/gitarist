# Gitarist

To proved that Github green grass("planting grass") means nothing

[![npm version](https://badge.fury.io/js/gitt-cli.svg)](https://badge.fury.io/js/gitt-cli)

- Multiple useful Github utilities based on `Octokit`
- Auto commit, auto cleaning stale workflows, auto cleaning dummy files etc.
- Run cron job using `Github Action`

## Issues

## How to use

- Rename `.env.example` to `.env` and fill the environment values by following instructions

```sh
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

<!-- ## setup Yarn berry

```sh
# "packageManager": "yarn@3.3.0",

# https://velog.io/@creco/next.js-%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0
rm -rf node_modules .npmrc .yarnrc
rm -rf .pnp.cjs .pnp.loader.mjs .yarnrc.yml .yarn
rm -rf yarn.lock
touch yarn.lock
yarn set version stable
echo 'nodeLinker: "pnp"' >> .yarnrc.yml
yarn install
yarn plugin import typescript
yarn add --dev typescript
yarn add @yarnpkg/sdks -D
yarn dlx @yarnpkg/sdks vscode
``` -->
