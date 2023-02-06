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
