import axios from 'axios';
import dotenv from 'dotenv';
import { parseRequestString } from './jira-api';

describe('jira api', () => {
  dotenv.config({ path: '.env.test' });
  const token = process.env.JIRA_TOKEN;
  const host = 'https://jira.woowa.in';

  it.skip('test template', async () => {
    console.debug(
      parseRequestString(
        'GET /rest/api/2/issue/{issueIdOrKey}/editmeta?expand=projects.issuetypes.fields',
      ),
    );
  });

  it.skip('get project', async () => {
    const projectKey = 'OPSTOOL'; // can be found in URL

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
    const boardId = 3036; // can be found as view or rapidView in URL. e.g., rapidView=xxxx

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

  it.skip('test', async () => {
    const response = await axios({
      baseURL: host,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      url: '/rest/api/2/issue',
      data: {
        fields: {
          project: {
            key: 'OPSTOOL',
          },
          summary: 'Test issue',
          description:
            'Creating of an issue using project keys and issue type names using the REST API',
          issuetype: {
            name: 'Task',
          },
          labels: ['BE'],
          // epic
          customfield_10006: 'OPSTOOL-2348', // [운영]opstool-hub
          // sprint
          // customfield_10004: [],
        },
      },
    }).catch((error) => {
      console.error(error);
    });

    const issueKey = response?.data?.key; // id, key, self

    if (issueKey) {
      const issueUrl = `https://jira.woowa.in/browse/${issueKey}`;
      console.debug({ ...response?.data, issueUrl });
    }
  });
});
