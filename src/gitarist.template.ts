export const actionTemplate = `name: Gitarist

on:
  workflow_dispatch:
  schedule:
    # for every N hours Monday to Saturday
    - cron: '0 */4 * * 1-6'

jobs:
  start:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npx gitarist run --token \${{ secrets.GITARIST_TOKEN }} --owner $GITHUB_REPOSITORY_OWNER --repo \${{ github.event.repository.name }}
`;

export const envTemplate = `
GITARIST_TOKEN=""
GITARIST_OWNER=""
GITARIST_REPO=""
`;

export const getPackageJsonTemplate = (projectName: string) => `{
  "name": "${projectName}",
  "version": "0.0.1",
  "license": "MIT",
  "main": "index.js",
  "scripts": {
    "start": "dotenv -e .env gitarist run --token $GITARIST_TOKEN --owner $GITARIST_OWNER --repo $GITARIST_REPO"
  },
  "dependencies": {
    "gitarist": "latest",
    "dotenv-cli": "latest"
  }
}
`;

export const getReadmeTemplate = (projectName: string) => `# ${projectName}
`;
