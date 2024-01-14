import { Vercel } from './vercel';

describe.skip('vercel', () => {
  it('should be true', () => {
    const vercel = new Vercel();
    expect(vercel).toBeTruthy();
  });

  it('deleteDeployment', async () => {
    const vercel = new Vercel();
    const deploymentId = 'foobar';
    await vercel.deleteDeployment({ deploymentId });
  });
});
