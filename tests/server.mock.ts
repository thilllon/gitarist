import { rest } from 'msw';
import { setupServer } from 'msw/node';

// https://stackoverflow.com/questions/65626653/create-react-app-doesnt-properly-mock-modules-from-mocks-directory/65627662#65627662

export const mockServer = setupServer(
  rest.get('https://api.github.com/orgs/octokit/repos', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([1, 2]));
  })
);

// NOTE: how to mock octokit(BAD PRACTICE)
// https://stackoverflow.com/a/68614624/11091456

// jest.mock('@octokit/rest')
// const request = () => new Promise((resolve, reject) => {
//   resolve({ status: 302, headers: { location: 'mock-url' } });
// })
// Octokit.mockImplementation(() => ({ request }))

export const OctokitMock = jest.fn().mockImplementation(() => ({
  repos: {
    listForOrg: jest.fn().mockResolvedValue([1, 2]),
  },
  git: {
    getRef: jest.fn().mockResolvedValue([1, 2]),
    getCommit: jest.fn().mockResolvedValue([1, 2]),
    createBlob: jest.fn().mockResolvedValue([1, 2]),
    createTree: jest.fn().mockResolvedValue([1, 2]),
    createCommit: jest.fn().mockResolvedValue([1, 2]),
    updateRef: jest.fn().mockResolvedValue([1, 2]),
  },
  issues: {
    create: jest.fn().mockResolvedValue([1, 2]),
    createComment: jest.fn().mockResolvedValue([1, 2]),
    list: jest.fn().mockResolvedValue([1, 2]),
    update: jest.fn().mockResolvedValue([1, 2]),
  },
  actions: {
    deleteWorkflowRun: jest.fn().mockImplementation(() => {
      const runs: any[] = [];
      return runs;
    }),
    deleteWorkflowRunLogs: jest.fn().mockResolvedValue([1, 2]),
    getWorkflow: jest.fn().mockResolvedValue([1, 2]),
    listRepoWorkflows: jest.fn().mockResolvedValue([1, 2]),
    getWorkflowUsage: jest.fn().mockResolvedValue([1, 2]),
    listWorkflowRunsForRepo: jest.fn().mockResolvedValue([1, 2]),
  },
  pulls: {
    get: jest.fn().mockResolvedValue([1, 2]),
    createReview: jest.fn().mockResolvedValue([1, 2]),
    submitReview: jest.fn().mockResolvedValue([1, 2]),
    merge: jest.fn().mockResolvedValue([1, 2]),
  },
  rateLimit: {
    get: jest.fn().mockResolvedValue([1, 2]),
  },
}));
