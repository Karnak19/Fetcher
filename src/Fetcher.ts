export type BeforeHooks = (
  url: string,
  options: RequestInit
) => Promise<void> | void;
export type AfterHooks = (
  response: Response,
  data: any
) => Promise<void> | void;

export interface FetcherOptions extends RequestInit {
  baseUrl?: string;
  onBefore?: BeforeHooks | BeforeHooks[];
  onAfter?: AfterHooks | AfterHooks[];
}

export interface FetcherResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

export interface FetcherError extends Error {
  status: number;
  data?: any;
  headers?: Headers;
}

export class FetcherError extends Error {
  status: number;
  data?: any;
  headers?: Headers;

  constructor(message: string, status: number, data?: any, headers?: Headers) {
    super(message);
    this.status = status;
    this.data = data;
    this.headers = headers;
  }
}

export class Fetcher {
  private baseUrl: string;
  private defaultOptions: RequestInit;
  private beforeHooks: BeforeHooks[] = [];
  private afterHooks: AfterHooks[] = [];

  constructor(options: FetcherOptions = {}) {
    this.baseUrl = options.baseUrl || "";
    const { onBefore, onAfter, ...rest } = options;

    if (onBefore) {
      this.beforeHooks = Array.isArray(onBefore) ? onBefore : [onBefore];
    }
    if (onAfter) {
      this.afterHooks = Array.isArray(onAfter) ? onAfter : [onAfter];
    }

    this.defaultOptions = rest;
  }

  addBeforeHook(hook: BeforeHooks) {
    this.beforeHooks.push(hook);
    return this;
  }

  addAfterHook(hook: AfterHooks) {
    this.afterHooks.push(hook);
    return this;
  }

  removeBeforeHook(hook: BeforeHooks) {
    this.beforeHooks = this.beforeHooks.filter((h) => h !== hook);
    return this;
  }

  removeAfterHook(hook: AfterHooks) {
    this.afterHooks = this.afterHooks.filter((h) => h !== hook);
    return this;
  }

  clearHooks() {
    this.beforeHooks = [];
    this.afterHooks = [];
    return this;
  }

  private async request<T>(path: string, options: RequestInit = {}) {
    const url = this.baseUrl + path;

    const mergedOptions = {
      ...this.defaultOptions,
      ...options,
    };

    mergedOptions.headers = {
      "Content-Type": "application/json",
      ...(this.defaultOptions.headers as Record<string, string>),
      ...(options.headers as Record<string, string>),
    };

    try {
      for (const hook of this.beforeHooks) {
        await hook(url, mergedOptions);
      }

      mergedOptions.headers = {
        ...mergedOptions.headers,
        ...options.headers,
      };

      const res = await fetch(url, mergedOptions);
      const data = await res.json().catch(() => null);

      for (const hook of this.afterHooks) {
        await hook(res, data);
      }

      if (!res.ok) {
        throw new FetcherError(res.statusText, res.status, data, res.headers);
      }

      return {
        data,
        status: res.status,
        headers: res.headers,
      } satisfies FetcherResponse<T>;
    } catch (error) {
      throw error;
    }
  }

  async get<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<FetcherResponse<T>> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<FetcherResponse<T>> {
    return this.request<T>(path, { ...options, method: "POST" });
  }

  async put<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<FetcherResponse<T>> {
    return this.request<T>(path, { ...options, method: "PUT" });
  }

  async delete<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<FetcherResponse<T>> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  parseError(error: Error) {
    if (error instanceof FetcherError) {
      return {
        message: error.message,
        status: error.status,
        data: error.data,
        headers: error.headers,
      };
    }
  }
}
