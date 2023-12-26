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
    const projectKey = 'OPSTOOL';

    const response = await axios({
      baseURL: host,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      url: `/rest/api/2/project/${projectKey}`,
    });
    console.debug(response?.data);
  });

  it.skip('get active spring ID', async () => {
    const boardId = 3036;

    const response = await axios({
      baseURL: host,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      url: `/rest/agile/1.0/board/${boardId}/sprint?state=active`,
    });
    console.debug(response?.data);
  });

  it.skip('test', async () => {
    const response = await axios({
      method: 'POST',
      baseURL: host,
      url: '/rest/api/2/issue',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
          // customfield_10004: [
          //   'com.atlassian.greenhopper.service.sprint.Sprint@3be3908d[id=11455,rapidViewId=3036,state=ACTIVE,name=운영도구개발팀 스프린트 24,startDate=2023-12-21T12:30:00.000+09:00,endDate=2024-01-04T12:30:00.000+09:00,completeDate=<null>,activatedDate=2023-12-21T12:44:40.802+09:00,sequence=11455,goal=,autoStartStop=false]',
          // ],
        },
      },
    }).catch((error) => {
      console.error(error);
    });

    // console.debug(response?.data);
    const issueKey = response?.data?.key;
    //   data: {
    //   id: '1253532',
    //   key: 'OPSTOOL-2904',
    //   self: 'https://jira.woowa.in/rest/api/2/issue/1253532'
    // }

    if (issueKey) {
      const issueUrl = `https://jira.woowa.in/browse/${issueKey}`;
      console.debug(issueUrl);
    }
  });
});
