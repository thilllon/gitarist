// export const getActionTemplate = (cron = '0 */4 * * 1-6') => `name: Gitarist

// on:
//   workflow_dispatch:
//   schedule:
//     # for every N hours Monday to Saturday
//     - cron: '${cron}'

// jobs:
//   start:
//     runs-on: ubuntu-latest
//     steps:
//       - uses: actions/checkout@v3
//       - uses: actions/setup-node@v3
//       - run: npx gitarist run --owner $GITHUB_REPOSITORY_OWNER --repo \${{ github.event.repository.name }} --token \${{ secrets.GITARIST_TOKEN }}
// `;

export const getActionTemplate = (cron = '0 */4 * * 1-6') => `name: Gitarist

on:
  workflow_dispatch:
  schedule:
    # for every N hours Monday to Saturday
    - cron: '${cron}'

jobs:
  start:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: |
          npx gitarist run \
          --owner $GITHUB_REPOSITORY_OWNER \  
          --repo \${{ github.event.repository.name }} \
          --token \${{ secrets.GITARIST_TOKEN }}
`;

export const getEnvTemplate = (owner = '', repo = '', token = '') => `
GITARIST_TOKEN="${token}"
GITARIST_OWNER="${owner}"
GITARIST_REPO="${repo}"
`;

export const getPackageJsonTemplate = (projectName: string) => `{
  "name": "${projectName}",
  "version": "0.0.1",
  "license": "MIT",
  "main": "index.js",
  "scripts": {
    "start": "dotenv -e .env gitarist run --owner $GITARIST_OWNER --repo $GITARIST_REPO" --token $GITARIST_TOKEN
  },
  "dependencies": {
    "gitarist": "latest",
    "dotenv-cli": "latest"
  }
}
`;

export const getReadmeTemplate = (projectName: string) => `# ${projectName}
`;
