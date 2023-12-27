export class Fetcher {
  private hooks: { onBefore?: (() => Headers)[] } = {};

  constructor(readonly baseUrl: string, readonly headers: Headers) {}

  private accumulateHeaders(requestHeaders?: Headers) {
    const headers = new Headers(this.headers);

    if (this.hooks.onBefore) {
      this.hooks.onBefore.forEach((c) => {
        const h = c();
        h.forEach((v, k) => {
          headers.set(k, v);
        });
      });
    }

    if (requestHeaders) {
      requestHeaders.forEach((v, k) => {
        headers.set(k, v);
      });
    }

    return headers;
  }

  private async handleRes<T>(res: Response) {
    if (!res.ok) {
      return Promise.reject(res);
    }
    if (res.status >= 400) {
      return Promise.reject(res);
    }
    return (await res.json()) as T;
  }

  async get<T>(url: string, headers?: Headers) {
    const res = await fetch(this.baseUrl + url, {
      method: "GET",
      headers: this.accumulateHeaders(headers),
    });

    return this.handleRes<T>(res);
  }

  async post<T>(url: string, body: BodyInit, headers?: Headers) {
    const res = await fetch(this.baseUrl + url, {
      method: "POST",
      headers: this.accumulateHeaders(headers),
      body,
    });

    return this.handleRes<T>(res);
  }

  async put<T>(url: string, body: BodyInit, headers?: Headers) {
    const res = await fetch(this.baseUrl + url, {
      method: "PUT",
      headers: this.accumulateHeaders(headers),
      body,
    });

    return this.handleRes<T>(res);
  }

  async delete<T>(url: string, body: BodyInit, headers?: Headers) {
    const res = await fetch(this.baseUrl + url, {
      method: "DELETE",
      headers: this.accumulateHeaders(headers),
      body,
    });

    return this.handleRes<T>(res);
  }

  // a method to setup onBefore hooks, that get called before every request

  onBefore(hooks: (() => Headers)[]) {
    hooks.forEach((c) => {
      this.hooks.onBefore = this.hooks.onBefore || [];

      this.hooks.onBefore.push(c);
    });

    return this;
  }
}
