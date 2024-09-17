import { describe, expect, it } from 'vitest';
import { VercelClient } from './vercel';

describe('vercel', () => {
  it.skip('should be true', () => {
    const vercel = new VercelClient();
    expect(vercel).toBeTruthy();
  });

  it.skip('deleteDeployment', async () => {
    const vercel = new VercelClient();
    const deploymentId = 'foobar';
    await vercel.deployment.delete({ deploymentId });
  });
});
