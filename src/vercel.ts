import axios, { AxiosInstance } from 'axios';

export class VercelClient {
  readonly projectId: string;
  readonly token: string;

  private readonly client: AxiosInstance;
  private readonly _baseUrl = 'https://api.vercel.com/v5/now';
  readonly deployment: VercelDeployment;

  constructor() {
    this.projectId = process.env.VERCEL_PROJECT_ID;
    this.token = process.env.VERCEL_TOKEN;
    this.client = axios.create({
      baseURL: this._baseUrl,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    this.deployment = new VercelDeployment();
  }
}

class VercelDeployment {
  async create({
    projectId,
    branch,
    commit,
  }: {
    projectId: string;
    branch: string;
    commit: string;
  }) {
    return axios.post('/v1/integrations/deployments', {
      projectId,
      branch,
      commit,
    });
  }

  async delete({ deploymentId }: { deploymentId: string }) {
    return axios.delete(`/v1/integrations/deployment/${deploymentId}`, {});
  }

  async list() {
    return axios.get('/v1/integrations/deployments', {});
  }
}

/**
 * usecases of Vercel
 */
export class Vercelion {
  async cleanUpDeployments() {
    // delete stale deployments
    // only keep the latest 5 deployments of each branch

    const numLeft = 3;
    const vercel = new VercelClient();

    const { data: list } = await vercel.deployment.list();
    const descSortedList = list.sort(
      (a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    );

    type Deployment = any;

    const branchDeploymentsMap = new Map<string, Deployment[]>();
    for (const deployment of descSortedList) {
      const branch = deployment.meta.gitBranch;
      if (branchDeploymentsMap.has(branch)) {
        branchDeploymentsMap.get(branch)?.push(deployment);
      } else {
        branchDeploymentsMap.set(branch, [deployment]);
      }
    }

    for (const [branch, deployments] of branchDeploymentsMap) {
      const toDelete = deployments.slice(numLeft);
      for (const deployment of toDelete) {
        await vercel.deployment.delete({ deploymentId: deployment.uid });
      }
    }
  }
}
