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
