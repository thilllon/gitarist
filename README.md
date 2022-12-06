# Gitt

To proved that Github green grass("planting grass") means nothing

- Multiple useful Github utilities based on `Octokit`
- Auto commit, auto cleaning stale workflows, auto cleaning dummy files etc.
- Run cron job using `Github Action`

## Issues

- [ ] commit dummy file are not stored in the `__commits` directory

## How to use

- Rename `.env.example` to `.env` and fill the environment values by following instructions

```sh
# development
yarn dev

# production
yarn build
yarn start
```

## How to make a clean git history

```sh
# interactive rebase and squash all except root commit
git rebase -i --root
# git rebase -i HEAD~11

# force push
git push origin -f main
```

## setup Yarn berry

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
```
