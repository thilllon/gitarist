import dotenv from 'dotenv';
import { JiraClient, Jiralyzer } from './jira';

jest.setTimeout(86400 * 1000);

describe.skip('jira', () => {
  dotenv.config({ path: '.env.test' });

  let host: string;
  let token: string;
  let projectKey: string;
  let jiralizer: Jiralyzer;
  let jiraClient: JiraClient;

  beforeAll(async () => {
    token = process.env.JIRA_TOKEN;
    host = process.env.JIRA_HOST;
    projectKey = process.env.JIRA_PROJECT_KEY; // can be found in URL. e.g., projectKey=xxxx

    jiraClient = new JiraClient({ host, personalAccessToken: token });
    jiralizer = new Jiralyzer();
  });

  describe('JiraClient', () => {
    it.skip('parseRequestString', async () => {
      const requestObject = jiraClient.parseRequestString(
        'GET /rest/api/2/issue/{issueIdOrKey}/editmeta?expand=projects.issuetypes.fields',
      );
      expect(requestObject).toEqual({
        method: 'GET',
        host,
        url: '/rest/api/2/issue/{issueIdOrKey}/editmeta?expand=projects.issuetypes.fields',
        queryParams: {},
      });
    });

    it.skip('get project', async () => {
      const response = await jiraClient.rest.project.get(projectKey, null, null);
      console.log(response?.data);
    });

    it.skip('get active sprint ID', async () => {
      // can be found as view or rapidView in URL. e.g., rapidView=xxxx
      const boardId = '3036';

      const response = await jiraClient.rest.sprint.get(boardId, null, { state: 'active' });
      console.log(response?.data);
    });

    it('list epics', async () => {
      const boardId = '2930';
      const projectKey = 'OPSTOOL';

      const response = await jiraClient.rest.board.listEpics(boardId, null, {
        projectKeyOrId: projectKey,
      });
      console.log(response.data);
    });

    it('createIssue', async () => {
      // https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issues/#api-rest-api-2-issue-post
      const fields = {
        epic: 'customfield_10006',
        sprint: 'customfield_10004',
      };
      const response = await jiraClient.rest.issue.create(
        {
          fields: {
            project: {
              key: 'OPSTOOL',
            },
            summary: 'test',
            description: 'test',
            issuetype: {
              name: 'Task',
            },
            labels: ['BE'],
            [fields.epic]: 'OPSTOOL-6',
            // [fields.sprint]: ['TEST_1'],
          },
        },
        null,
      );
      const { id, key, self } = JSON.parse(response.data);
      const issueUrl = key ? `${host}/browse/${key}` : '';
      console.log({ id, key, self, issueUrl });
    });

    it.skip('add watcher', async () => {
      const issueId = 'OPSTOOL-344';
      const watcher = 'jakelee';

      await jiraClient.rest.watcher.add(issueId, watcher, null);
    });
  });

  describe('Jiralyzer', () => {
    it('find issues by assignee and add me as a watcher', async () => {
      // find issues by assignee
      const assignee = 'dh.kang';
      const watcher = 'jakelee';

      await jiralizer.addWatcherToAllIssuesOfAssignee(assignee, watcher, {});
    });
  });

  it('updateMultipleIssues', async () => {
    await jiralizer.updateMultipleIssues();
  });
});
