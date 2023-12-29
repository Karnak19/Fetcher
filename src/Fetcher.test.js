import { test, expect, describe, beforeEach } from "vitest";
import { Fetcher } from "./Fetcher";

const baseUrl = "https://test.com";
const baseHeaders = new Headers({ "Content-Type": "application/json" });

test("noop", async () => {
  expect(1).toBe(1);
});

describe("Fetcher", () => {
  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockResponseOnce(JSON.stringify({ data: "12345" }));
  });

  test("GET", async () => {
    const fetcher = new Fetcher(baseUrl, baseHeaders);
    const res = await fetcher.get("/test", new Headers({ "x-test": "test" }));

    expect(res.data).toEqual("12345");
  });

  test("POST", async () => {
    const fetcher = new Fetcher(baseUrl, baseHeaders);
    const res = await fetcher.post("/test", { data: "test" });

    expect(res.data).toEqual("12345");
  });

  test("default headers", async () => {
    const fetcher = new Fetcher(baseUrl, baseHeaders);
    await fetcher.get("/test", new Headers({ "x-test": "test" }));

    const { headers } = fetch.requests()[0];

    expect(headers.get("Content-Type")).toEqual("application/json");
  });

  test("onBefore hook", async () => {
    const fetcher = new Fetcher(baseUrl, baseHeaders);
    fetcher.onBefore([
      () => new Headers({ "x-another-test": "adefinitlybettertoken" }),
    ]);

    await fetcher.get("/test", new Headers({ "x-test": "test" }));

    const { headers } = fetch.requests()[0];

    expect(headers.get("Content-Type")).toEqual("application/json");
    expect(headers.get("x-test")).toEqual("test");
    expect(headers.get("x-another-test")).toEqual("adefinitlybettertoken");
  });

  test("onBefore hook override Content-Type", async () => {
    const fetcher = new Fetcher(baseUrl, baseHeaders);

    fetcher.onBefore([
      () =>
        new Headers({ "Content-Type": "application/x-www-form-urlencoded" }),
    ]);

    await fetcher.get("/test", new Headers({ "x-test": "test" }));

    const { headers } = fetch.requests()[0];

    expect(headers.get("Content-Type")).toEqual(
      "application/x-www-form-urlencoded"
    );
    expect(headers.get("x-test")).toEqual("test");
  });

  test("per request headers", async () => {
    const fetcher = new Fetcher(baseUrl, baseHeaders);
    await fetcher.get("/test", new Headers({ "x-test": "test" }));

    const { headers } = fetch.requests()[0];

    expect(headers.get("Content-Type")).toEqual("application/json");
    expect(headers.get("x-test")).toEqual("test");
  });

  test("per request header override base one", async () => {
    const fetcher = new Fetcher(baseUrl, baseHeaders);
    await fetcher.get("/test", new Headers({ "Content-Type": "text/plain" }));

    const { headers } = fetch.requests()[0];

    expect(headers.get("Content-Type")).toEqual("text/plain");
  });

  test("per request header override onBefore one", async () => {
    const fetcher = new Fetcher(baseUrl, baseHeaders);
    fetcher.onBefore([
      () =>
        new Headers({ "Content-Type": "application/x-www-form-urlencoded" }),
    ]);

    await fetcher.get("/test", new Headers({ "Content-Type": "text/plain" }));

    const { headers } = fetch.requests()[0];

    expect(headers.get("Content-Type")).toEqual("text/plain");
  });
});
