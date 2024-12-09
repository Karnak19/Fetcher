import { test, expect, describe, beforeEach } from "vitest";
import { Fetcher } from "./Fetcher";

const baseUrl = "https://test.com";
const baseHeaders = new Headers({ "Content-Type": "application/json" });

describe("Fetcher", () => {
  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockResponseOnce(JSON.stringify({ value: "12345" }));
  });

  describe("HTTP Methods", () => {
    test("GET request", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      const res = await fetcher.get("/test", {
        headers: { "x-test": "test" },
      });

      expect(res.data.value).toEqual("12345");
      expect(res.status).toEqual(200);
      expect(res.headers).toBeDefined();
    });

    test("POST request", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      const res = await fetcher.post("/test", {
        body: JSON.stringify({ data: "test" }),
      });

      expect(res.data.value).toEqual("12345");
      expect(res.status).toEqual(200);
    });

    test("PUT request", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      const res = await fetcher.put("/test", {
        body: JSON.stringify({ data: "test" }),
      });

      expect(res.data.value).toEqual("12345");
      expect(res.status).toEqual(200);
    });

    test("DELETE request", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      const res = await fetcher.delete("/test");

      expect(res.data.value).toEqual("12345");
      expect(res.status).toEqual(200);
    });
  });

  describe("Headers Handling", () => {
    test("handles headers as plain objects", async () => {
      const fetcher = new Fetcher({
        baseUrl,
        headers: { "x-base": "base-value" },
      });

      // Test with request headers
      await fetcher.get("/test", {
        headers: {
          "x-test": "test",
          "Content-Type": "text/plain",
        },
      });

      let { headers } = fetch.requests()[0];
      expect(headers.get("x-base")).toBe("base-value");
      expect(headers.get("x-test")).toBe("test");
      expect(headers.get("Content-Type")).toBe("text/plain");
    });

    test("default Content-Type is set when not provided", async () => {
      const fetcher = new Fetcher({ baseUrl });

      await fetcher.get("/test", {
        headers: { "x-test": "test" },
      });

      const { headers } = fetch.requests()[0];
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    test("headers precedence is correct", async () => {
      const fetcher = new Fetcher({
        baseUrl,
        headers: {
          "x-base": "base-value",
          "x-override": "original",
        },
      });

      await fetcher.get("/test", {
        headers: {
          "x-override": "overridden",
          "x-new": "new-value",
        },
      });

      const { headers } = fetch.requests()[0];
      expect(headers.get("x-base")).toBe("base-value");
      expect(headers.get("x-override")).toBe("overridden");
      expect(headers.get("x-new")).toBe("new-value");
    });
  });

  describe("Hooks", () => {
    test("addBeforeHook hook", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      fetcher.addBeforeHook((_, options) => {
        options.headers["x-another-test"] = "adefinitlybettertoken";
      });

      await fetcher.get("/test", { headers: { "x-test": "test" } });

      const { headers } = fetch.requests()[0];

      expect(headers.get("Content-Type")).toEqual("application/json");
      expect(headers.get("x-test")).toEqual("test");
      expect(headers.get("x-another-test")).toEqual("adefinitlybettertoken");
    });

    test("addBeforeHook hook override Content-Type", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });

      fetcher.addBeforeHook((_, options) => {
        options.headers["Content-Type"] = "application/x-www-form-urlencoded";
      });

      await fetcher.get("/test", { headers: { "x-test": "test" } });

      const { headers } = fetch.requests()[0];

      expect(headers.get("Content-Type")).toEqual(
        "application/x-www-form-urlencoded"
      );
      expect(headers.get("x-test")).toEqual("test");
    });

    test("addAfterHook is called with response", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      let responseData;

      fetcher.addAfterHook((_, data) => {
        responseData = data;
      });

      await fetcher.get("/test");

      expect(responseData).toEqual({ value: "12345" });
    });

    test("removeBeforeHook removes specific hook", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      const hook = (_, options) => {
        options.headers["x-test"] = "should-not-exist";
      };

      fetcher.addBeforeHook(hook);
      fetcher.removeBeforeHook(hook);

      await fetcher.get("/test");

      const { headers } = fetch.requests()[0];
      expect(headers.get("x-test")).toBeNull();
    });

    test("removeAfterHook removes specific hook", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      let called = false;
      const hook = () => {
        called = true;
      };

      fetcher.addAfterHook(hook);
      fetcher.removeAfterHook(hook);

      await fetcher.get("/test");

      expect(called).toBeFalsy();
    });

    test("clearHooks removes all hooks", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      let beforeCalled = false;
      let afterCalled = false;

      fetcher.addBeforeHook(() => {
        beforeCalled = true;
      });
      fetcher.addAfterHook(() => {
        afterCalled = true;
      });
      fetcher.clearHooks();

      await fetcher.get("/test");

      expect(beforeCalled).toBeFalsy();
      expect(afterCalled).toBeFalsy();
    });
  });

  describe("Error Handling", () => {
    test("handles network errors", async () => {
      fetch.resetMocks();
      fetch.mockReject(new Error("Network error"));

      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });

      await expect(fetcher.get("/test")).rejects.toThrow("Network error");
    });

    test("handles API errors with error response", async () => {
      fetch.resetMocks();
      fetch.mockResponseOnce(JSON.stringify({ message: "Not found" }), {
        status: 404,
        statusText: "Not Found",
      });

      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });

      try {
        await fetcher.get("/test");
      } catch (error) {
        const parsedError = fetcher.parseError(error);
        expect(parsedError.status).toBe(404);
        expect(parsedError.data).toEqual({ message: "Not found" });
        expect(parsedError.message).toBe("Not Found");
      }
    });

    test("parseError returns undefined for non-FetcherError", async () => {
      const fetcher = new Fetcher({ baseUrl, headers: baseHeaders });
      const error = new Error("Regular error");

      expect(fetcher.parseError(error)).toBeUndefined();
    });
  });
});
