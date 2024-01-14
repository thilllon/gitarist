import axios, { AxiosInstance } from 'axios';

export class Vercel {
  private readonly client: AxiosInstance;
  private readonly _baseUrl = 'https://api.vercel.com/v5/now';

  constructor() {
    const projectId = process.env.VERCEL_PROJECT_ID;
    const token = process.env.VERCEL_TOKEN;
    this.client = axios.create({
      baseURL: this._baseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  async deleteDeployment({ deploymentId }: { deploymentId: string }) {
    await axios.delete(`/v1/integrations/deployment/${deploymentId}`, {});
  }
}
