import { VercelClient } from './vercel';

describe.skip('vercel', () => {
  it('should be true', () => {
    const vercel = new VercelClient();
    expect(vercel).toBeTruthy();
  });

  it('deleteDeployment', async () => {
    const vercel = new VercelClient();
    const deploymentId = 'foobar';
    await vercel.deleteDeployment({ deploymentId });
  });
});
