/**
 * https://developer.atlassian.com/server/jira/platform/rest-apis/
 * https://<HOST>:<PORT>/<CONTEXT>/rest/<API-NAME>/<API-VERSION>/<RESOURCE-NAME>
 */

export const jiraRestEndpoints = {
  issue: {
    create: {
      desciption: 'POST /rest/api/2/issue',
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
  },
} as const;

interface RequestObject {
  method: string;
  host: string;
  query: Record<string, boolean>;
  params: Record<string, boolean>;
}

export function parseRequestString(endpoint: string): RequestObject | null {
  const methodRegex = /^(GET|POST|PUT|PATCH|DELETE)\s+/;
  const matchMethod = endpoint.match(methodRegex);

  if (!matchMethod) {
    return null;
  }

  const method = matchMethod[1];
  const urlAndQuery = endpoint.slice(matchMethod[0].length);
  const urlParts = urlAndQuery.split('?');
  const host = urlParts[0];
  const queryParams = urlParts[1] ? urlParts[1].split('&') : [];

  const query: Record<string, boolean> = {};
  queryParams.forEach((param) => {
    const [key, value] = param.split('=');
    // has value => required query parameter
    // empty value => optional query parameter
    query[key] = typeof value === 'string' && value !== '' ? true : false;
  });

  const params: Record<string, boolean> = {};
  const paramRegex = /\{([^}]+)\}/g;
  const paramMatches = host.match(paramRegex);

  if (paramMatches) {
    paramMatches.forEach((match) => {
      const paramName = match.slice(1, -1);
      params[paramName] = true;
    });
  }

  return {
    method,
    host,
    query,
    params,
  };
}

export class JiraClient {
  rest: any;
  private readonly _host: string;

  constructor({
    host,
    personalAccessToken: personalAccessToken,
  }: {
    host: string;
    personalAccessToken: string;
  }) {
    this._host = host;

    this.rest = {
      issue: {
        create: (input: any) => {
          return fetch(this.pathToUrl(jiraRestEndpoints.issue.create.path), {
            body: JSON.stringify(input),

            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${personalAccessToken}`,
            },
          });
        },
      },
    };
  }

  private pathToUrl(path: string) {
    return `${this._host}/${path}`;
  }
}

// Example usage:
const inputString =
  'PUT /rest/api/2/issue/{issueIdOrKey}?key=someKeyword&value=2020-01-01';
const requestObject = parseRequestString(inputString);

if (requestObject) {
  console.log(requestObject);
} else {
  console.log('Invalid input string');
}
