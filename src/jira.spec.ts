import axios from 'axios';
import dotenv from 'dotenv';
import { JiraClient, Jiralyzer } from './jira';

jest.setTimeout(86400 * 1000);

describe('jira', () => {
  dotenv.config({ path: '.env.test' });

  let host: string;
  let token: string;
  let projectKey: string;
  let jiralizer: Jiralyzer;
  beforeAll(async () => {
    token = process.env.JIRA_TOKEN;
    host = process.env.JIRA_HOST;
    projectKey = process.env.JIRA_PROJECT_KEY;

    jiralizer = new Jiralyzer();
  });

  // FIXME: 테스트 이후 private method로 변경하기
  it.skip('parseRequestString', async () => {
    const jiraClient = new JiraClient({ host, personalAccessToken: token });
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

  it.skip('get project by project key', async () => {
    const projectKey = process.env.JIRA_PROJECT_KEY; // can be found in URL. e.g., projectKey=OPSTOOL

    const response = await axios({
      baseURL: host,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
      url: `/rest/api/2/project/${projectKey}`,
    });
    console.debug(response?.data);
  });

  it.skip('get active sprint ID', async () => {
    // can be found as view or rapidView in URL. e.g., rapidView=xxxx
    const boardId = 3036;

    const response = await axios({
      baseURL: host,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
      url: `/rest/agile/1.0/board/${boardId}/sprint?state=active`,
    });
    console.debug(response?.data);
  });

  it.skip('createIssueWithSummaryAndDescription', async () => {
    const response = await jiralizer.createOpstoolIssueWithSummaryAndDescription({
      summary: 'test',
      description: 'test',
    });

    const issueKey = response.data?.key; // {id, key, self}
    const issueUrl = issueKey ? `${host}/browse/${issueKey}` : '';
    console.debug({ ...response?.data, issueUrl });
  });

  it.skip('find issues by assignee and add me as a watcher', async () => {
    // find issues by assignee
    const assignee = 'dh.kang';
    const watcher = 'jakelee';

    await jiralizer.addWatcherToAllIssuesOfAssignee(assignee, watcher, {});
  });
});
