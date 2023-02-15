export class Templates {
  /**
   *
   * @param {string} cron e.g., '0 \*\/4 \* \* 1-6' means 'for every N hours Monday to Saturday'
   * @returns {string}
   */
  static getActionTemplate(cron = '0 */4 * * 1-6') {
    const template = `name: Gitarist

on:
  workflow_dispatch:
  schedule:
    - cron: '${cron}'

jobs:
  start:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npx gitarist run --owner $GITHUB_REPOSITORY_OWNER --repo \${{ github.event.repository.name }} --token \${{ secrets.GITARIST_TOKEN }}
`;

    return template;
  }

  static getEnvTemplate(owner = '', repo = '', token = '') {
    const template = `
GITARIST_TOKEN="${token}"
GITARIST_OWNER="${owner}"
GITARIST_REPO="${repo}"
`;

    return template;
  }

  static getPackageJsonTemplate(projectName: string) {
    const template = `{
  "name": "${projectName}",
  "version": "0.0.1",
  "license": "MIT",
  "main": "index.js",
  "scripts": {
    "start": "dotenv -e .env gitarist run --owner $GITARIST_OWNER --repo $GITARIST_REPO --token $GITARIST_TOKEN"
  },
  "dependencies": {
    "gitarist": "latest",
    "dotenv-cli": "latest"
  }
}
`;

    return template;
  }

  static getReadmeTemplate(projectName: string) {
    const template = `# ${projectName}
`;

    return template;
  }
}
