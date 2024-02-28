/* eslint-disable @typescript-eslint/ban-types */
/**
 * https://developer.atlassian.com/server/jira/platform/rest-apis/
 * https://docs.atlassian.com/software/jira/docs/api/REST/9.14.0
 * https://<HOST>:<PORT>/<CONTEXT>/rest/<API-NAME>/<API-VERSION>/<RESOURCE-NAME>
 */

import { Axios, AxiosError, AxiosResponse } from 'axios';

type RequestObject = {
  method: string;
  host: string;
  pathname: string;
  searchParams: Record<string, boolean>;
};

interface CustomResponse<T> {
  data: T | null;
  error: any | null;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

type CreateIssueBody = any;
type CreateIssueParams = null;
type GetIssueBody = null;
type GetIssueParams = null;
type DeleteIssueBody = null;
type DeleteIssueParams = null;
/**
 * @example
 * const sampleEditRequestBody = {
  update: {
    summary: [{ set: 'Bug in business logic' }],
    components: [{ set: '' }],
    timetracking: [{ edit: { originalEstimate: '1w 1d', remainingEstimate: '4d' } }],
    labels: [{ add: 'triaged' }, { remove: 'blocker' }],
  },
  fields: {
    summary: 'This is a shorthand for a set operation on the summary field',
    customfield_10010: 1,
    customfield_10000: 'This is a shorthand for a set operation on a text custom field',
  },
  historyMetadata: {
    type: 'myplugin:type',
    description: 'text description',
    descriptionKey: 'plugin.changereason.i18.key',
    activityDescription: 'text description',
    activityDescriptionKey: 'plugin.activity.i18.key',
    actor: {
      id: 'tony',
      displayName: 'Tony',
      type: 'mysystem-user',
      avatarUrl: 'http://mysystem/avatar/tony.jpg',
      url: 'http://mysystem/users/tony',
    },
    generator: { id: 'mysystem-1', type: 'mysystem-application' },
    cause: { id: 'myevent', type: 'mysystem-event' },
    extraData: { keyvalue: 'extra data', goes: 'here' },
  },
  properties: [
    { key: 'key1', value: 'properties can be set at issue create or update time' },
    { key: 'key2', value: 'and there can be multiple properties' },
  ],
};
 */
type EditIssueBody = {};
type EditIssueParams = null;
type SearchIssuesBody = null;
type SearchIssuesParams = {
  /**
   * `assignee=john.doe`
   */
  jql?: string;
  maxResults?: number;
  startAt?: number;
  fields?: string[];
};
type AddWatcherBody = string;
type AddWatcherParams = null;
type RemoveWatcherBody = null;
type RemoveWatcherParams = null;
type ListWatcherBody = null;
type ListWatcherParams = null;

export class JiraClient {
  private client;
  /**
   * namespaces e.g., rest, graphql, etc.
   */
  public rest;

  private readonly endpoints = {
    issue: {
      create: {
        description: 'POST /rest/api/2/issue',
        method: 'POST',
        path: '/rest/api/2/issue',
        query: {},
        body: {},
      },
      get: {
        description: 'GET /rest/api/2/issue/{issueIdOrKey}',
        method: 'GET',
        path: '/rest/api/2/issue/{issueIdOrKey}',
        query: {},
        body: {},
      },
      delete: {
        description: 'DELETE /rest/api/2/issue/{issueIdOrKey}',
        method: 'DELETE',
        path: '/rest/api/2/issue/{issueIdOrKey}',
        query: {},
        body: {},
      },
      edit: {
        description: 'PUT /rest/api/2/issue/{issueIdOrKey}',
        method: 'PUT',
        path: '/rest/api/2/issue/{issueIdOrKey}',
        query: {},
        body: {},
      },
      // TODO: api v3 사용 고려하기
      search: {
        description: 'GET /rest/api/2/search?jql=assignee={assignee}',
        method: 'GET',
        path: '/rest/api/2/search',
        query: {
          jql: String,
          maxResults: Number,
        },
        body: {},
      },
    },
    watcher: {
      add: {
        description: 'POST /rest/api/2/issue/{issueIdOrKey}/watchers',
        method: 'POST',
        path: '/rest/api/2/issue/{issueIdOrKey}/watchers',
        query: {},
        body: {},
      },
      remove: {
        description: 'DELETE /rest/api/2/issue/{issueIdOrKey}/watchers',
        method: 'DELETE',
        path: '/rest/api/2/issue/{issueIdOrKey}/watchers',
        query: {},
        body: {},
      },
      list: {
        // GET /rest/api/2/issue/{issueIdOrKey}/watchers
        description: 'GET /rest/api/2/issue/{issueIdOrKey}/watchers',
        method: 'GET',
        path: '/rest/api/2/issue/{issueIdOrKey}/watchers',
        query: {},
        body: {},
      },
    },
  } as const;

  constructor({
    host,
    personalAccessToken,
  }: {
    /**
     * Jira host
     * @example https://jira.atlassian.com
     */
    host?: string;
    /**
     * Personal Access Token (PAT)
     * @example ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
     */
    personalAccessToken?: string;
  }) {
    host = host ?? process.env.JIRA_HOST;
    personalAccessToken = personalAccessToken ?? process.env.JIRA_TOKEN;
    if (!host) {
      throw new Error('Missing environment variable: "JIRA_HOST". e.g. https://jira.atlassian.com');
    }
    if (!personalAccessToken) {
      throw new Error(
        'Missing environment variable "JIRA_TOKEN". Please create a personal access token (PAT) at your profile page and set it as an environment variable.',
      );
    }

    this.client = new Axios({
      baseURL: host,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${personalAccessToken}`,
      },
    });

    // Add a response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse): CustomResponse<any> => {
        // Transform the response to include the custom structure
        return {
          ...response,
          data: response.data,
          error: null,
        };
      },
      (error: AxiosError): Promise<CustomResponse<null>> => {
        // Handle errors and format them according to the custom response structure
        return Promise.resolve({
          ...error,
          status: error.response?.status ?? 500,
          statusText: error.response?.statusText ?? 'Internal Server Error',
          headers: error.response?.headers ?? {},
          config: error.config,
          data: null,
          error: error.response?.data ?? error.message,
        });
      },
    );

    this.rest = {
      issue: {
        create: async (data: CreateIssueBody, params: CreateIssueParams) => {
          return this.client.request({
            method: this.endpoints.issue.create.method,
            url: this.endpoints.issue.create.path,
            params,
            data,
          });
        },
        get: async (issueIdOrKey: string, data: GetIssueBody, params: GetIssueParams) => {
          return this.client.request({
            method: this.endpoints.issue.get.method,
            url: this.endpoints.issue.get.path.replace('{issueIdOrKey}', issueIdOrKey),
            params,
            data,
          });
        },
        delete: async (issueIdOrKey: string, data: DeleteIssueBody, params: DeleteIssueParams) => {
          return this.client.request({
            method: this.endpoints.issue.delete.method,
            url: this.endpoints.issue.delete.path.replace('{issueIdOrKey}', issueIdOrKey),
            params,
            data,
          });
        },
        edit: async (issueIdOrKey: string, data: EditIssueBody, params: EditIssueParams) => {
          return this.client.request({
            method: this.endpoints.issue.edit.method,
            url: this.endpoints.issue.edit.path.replace('{issueIdOrKey}', issueIdOrKey),
            params,
            data,
          });
        },
        search: async (data: SearchIssuesBody, params: SearchIssuesParams) => {
          return this.client.request({
            method: this.endpoints.issue.search.method,
            url: this.endpoints.issue.search.path,
            params,
            data,
          });
        },
      },
      watcher: {
        add: async (issueIdOrKey: string, data: AddWatcherBody, params: AddWatcherParams) => {
          return this.client.request({
            method: this.endpoints.watcher.add.method,
            url: this.endpoints.watcher.add.path.replace('{issueIdOrKey}', issueIdOrKey),
            params,
            data: `"${data}"`,
          });
        },
        removeMe: async (
          issueIdOrKey: string,
          data: RemoveWatcherBody,
          params: RemoveWatcherParams,
        ) => {
          return this.client.request({
            method: this.endpoints.watcher.remove.method,
            url: this.endpoints.watcher.remove.path.replace('{issueIdOrKey}', issueIdOrKey),
            params,
            data,
          });
        },
        list: async (issueIdOrKey: string, data: ListWatcherBody, params: ListWatcherParams) => {
          return this.client.request({
            method: this.endpoints.watcher.list.method,
            url: this.endpoints.watcher.list.path.replace('{issueIdOrKey}', issueIdOrKey),
            params,
            data,
          });
        },
      },
    } as const;
  }

  // TODO: spec doc에 있는 문구를 그대로 파싱해오면 API 호출형태로 만들기위해 사용하는 함수
  // 효용성이 없는 경우 삭제할 예정
  parseRequestString(endpoint: string): RequestObject {
    // endpoint는 다음과 같은 형태로 들어옴
    // PUT /rest/api/2/issue/{issueIdOrKey}?key={someKeyword}&value={2020-01-01}
    // 애초에 invalid URL이라서 URLSearchParams를 못씀
    // 직접 만들어서 써야함

    const matchedMethod = endpoint.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+/);

    if (!matchedMethod) {
      throw new Error('Invalid method in endpoint string.');
    }
    const method = matchedMethod[1];
    const pathWithSearchParams = endpoint.slice(matchedMethod[0].length).trim();

    return {
      method,
      host: '',
      searchParams: {},
      pathname: '',
    };
  }
}

/**
 * usecases of Jira
 */
export class Jiralyzer {
  private jiraClient;

  constructor() {
    this.jiraClient = new JiraClient({});
  }

  async addLabelsToIssue(issueId: string, labels: string[]) {
    return this.jiraClient.rest.issue.edit(
      issueId,
      {
        update: {
          labels: labels.map((label) => ({ add: label })),
        },
      },
      null,
    );
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async removeLabelsToIssue(issueId: string, labels: string[]) {
    return this.jiraClient.rest.issue.edit(
      issueId,
      {
        update: {
          labels: labels.map((label) => ({ remove: label })),
        },
      },
      null,
    );
  }

  async addWatcher(issueId: string, watcher: string) {
    return this.jiraClient.rest.watcher.add(issueId, watcher, null);
  }

  async addWatcherToAllIssuesOfAssignee(
    assignee: string,
    watcher: string,
    options: {
      /**
       * sleep time between each HTTP request
       */
      sleepTime?: number;
      fetchSize?: number;
      maxIteration?: number;
    },
  ) {
    const sleepTime = options?.sleepTime ?? 1000;
    const fetchSize = options?.fetchSize ?? 100;
    const maxIteration = options?.maxIteration ?? 999;

    console.table({
      assignee,
      watcher,
      sleepTime,
      fetchSize,
      maxIteration,
    });

    const totalIssues: any[] = [];
    console.log('Looking for issues for the assignee.');
    for (const iter of Array(maxIteration).keys()) {
      const response = await this.jiraClient.rest.issue.search(null, {
        jql: `assignee = ${assignee} ORDER BY created DESC`,
        startAt: iter * fetchSize,
        maxResults: fetchSize,
        fields: ['id', 'key', 'created', 'summary', 'status', 'assignee'],
      });

      const issues =
        typeof response?.data === 'string'
          ? JSON.parse(response.data).issues
          : response?.data?.issues;
      if (!(issues?.length > 0)) {
        console.log(`No more issues found.`);
        break;
      } else {
        console.log(`Found ${issues.length} issues.`);
      }
      totalIssues.push(...issues);
      await this.sleep(sleepTime);
    }
    console.log(`Total issues found for the assignee: ${totalIssues.length}`);

    for (const issue of totalIssues) {
      const response = await this.jiraClient.rest.watcher.add(issue.key, watcher, null);
      console.log(`key=${issue.key} status=${response.status}`);
    }
  }

  async createOpstoolIssueWithSummaryAndDescription({
    summary,
    description,
  }: {
    summary: string;
    description: string;
  }) {
    return this.jiraClient.rest.issue.create(
      {
        fields: {
          project: {
            key: 'OPSTOOL',
          },
          summary,
          description,
          issuetype: {
            name: 'Task',
          },
          labels: ['BE'],
          // epic
          // customfield_10006: 'TEST_1',
          // sprint
          // customfield_10004: [],
        },
      },
      null,
    );
  }
}
