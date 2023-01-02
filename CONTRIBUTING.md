# Contributing

1. [Fork it](https://help.github.com/articles/fork-a-repo/)
2. Install dependencies (`pnpm install`)
3. Create your feature branch (`git checkout -b my-new-feature`)
4. Commit your changes (`git cz` or `git commit -am 'feat: added some feature'`)
5. Test your changes (`pnpm test`)
6. Push to the branch (`git push origin my-new-feature`)
7. [Create new Pull Request](https://help.github.com/articles/creating-a-pull-request/)

## Quick start

```sh
# Rename `.env.example` to `.env` and fill the environment variables
cp .env.example .env

# Install dependencies
pnpm

# In development
pnpm dev

# In production
pnpm build
pnpm start
```

## Testing

We use [Jest](https://github.com/facebook/jest) to write tests. Run our test suite with this command:

```sh
pnpm test
```

## Code Style

We use [Prettier](https://prettier.io/) and tslint to maintain code style and best practices.
Please make sure your PR adheres to the guides by running:

```sh
pnpm format
```

and

```sh
pnpm lint
```