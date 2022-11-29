# Gitt

Github green grass("planting grass") means nothing

- Multiple useful Github utilities based on Octokit
- Auto commit, auto cleaning stale workflows, auto cleaning dummy files etc.
- Run cron job using Github Action

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

# force push
git push origin -f main
```
