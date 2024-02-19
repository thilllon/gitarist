/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'axios';

declare module 'axios' {
  interface AxiosResponse<T = any, D = any> {
    // @ts-ignore
    data: T | null;
    error: any | null;
    status: number;
    statusText: string;
    // @ts-ignore
    headers: any;
    // @ts-ignore
    config: any;
  }

  interface ASDF {
    asdf: number;
  }
}

export {};
