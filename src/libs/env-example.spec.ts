describe('env-example', () => {
  it('should create an example .env file', async () => {
    //     // Arrange
    //     const filename = '.env.sample';
    //     const comments = true;
    //     const merge = true;
    //     const expectedOutput = `# GITHUB_OWNER=
    // GITHUB_REPO=
    // GITHUB_TOKEN=
    // `;
    //     const fs = {
    //       readFileSync: jest.fn().mockReturnValue(`GITHUB_OWNER=
    // GITHUB_REPO
    // GITHUB_TOKEN
    // `),
    //       writeFileSync: jest.fn(),
    //     };
    //     const path = {
    //       join: jest.fn().mockReturnValue('.env'),
    //     };
    //     const process = {
    //       cwd: jest.fn().mockReturnValue('/path/to/cwd'),
    //     };
    //     await createEnvExample({ filename, comments, merge });
    //     expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/cwd/.env', 'utf8');
    //     expect(fs.writeFileSync).toHaveBeenCalledWith('/path/to/cwd/.env.example', expectedOutput, {
    //       encoding: 'utf-8',
    //       flag: 'w+',
    //     });
  });

  afterAll(async () => {
    // execSync('rm -f .env.invalid');
    // execSync('rm -f .env.valid');
  });

  it('should throw an error if a line does not have a valid config', async () => {
    const envContent = `GITHUB_OWNER="foo"
GITHUB_REPO="bar"
GITHUB_REPO="bar"
GITHUB_REPO="bar"
GITHUB_REPO="bar"
GITHUB_TOKEN="baz"

########################################################

GITLAB_HOST="foo"
GITLAB_HOST="foo"
GITLAB_HOST="foo"
GITLAB_HOST="foo"
GITLAB_HOST="foo"
GITLAB_TOKEN="bar"
# project token
GITLAB_TOKEN="baz" 
GITLAB_PROJECT_ID="1234"

########################################################

# Profile > Personal Access Tokens > Create API Token
JIRA_TOKEN="foo"
JIRA_PROJECT_KEY="bar"
JIRA_HOST="baz"
JIRA_HOST="baz"
JIRA_HOST="baz"
JIRA_HOST="baz"
`;
    // execSync(`echo ${envContent} > .env.valid`);

    // createEnvExample({
    //   filename: ' .env.valid',
    //   comments: true,
    //   merge: true,
    // });
  });
});
