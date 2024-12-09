# Fetcher

A lightweight (less than 1kb gzipped), TypeScript-first HTTP client with hooks support and elegant error handling.

## Features

- 🚀 Promise-based API
- 📝 Full TypeScript support
- 🪝 Before/After request hooks
- 🔄 Automatic JSON parsing
- 🎯 Base URL support
- 🛡️ Elegant error handling

## Installation

```bash
npm install @Karnak19/Fetcher
```

## Usage

### Basic Usage

```typescript
import { Fetcher } from "@Karnak19/Fetcher";

const api = new Fetcher({
  baseUrl: "https://api.example.com",
});

// GET request
const { data } = await api.get<User>("/users/1");

// POST request
const response = await api.post<User>("/users", {
  body: JSON.stringify({ name: "John" }),
});

// PUT request
await api.put("/users/1", {
  body: JSON.stringify({ name: "John Updated" }),
});

// DELETE request
await api.delete("/users/1");
```

### Using Hooks

```typescript
const api = new Fetcher({
  baseUrl: "https://api.example.com",
  onBefore: async (url, options) => {
    // Add authentication header
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${getToken()}`,
    };
  },
  onAfter: async (response, data) => {
    // Log response
    console.log(`${response.status}: ${JSON.stringify(data)}`);
  },
});

// Add hooks after initialization
api.addBeforeHook(async (url, options) => {
  console.log(`Requesting: ${url}`);
});

// Remove specific hooks
api.removeBeforeHook(myHook);
api.removeAfterHook(myHook);

// Clear all hooks
api.clearHooks();
```

### Error Handling

```typescript
try {
  await api.get("/users/999");
} catch (error) {
  const parsedError = api.parseError(error);
  if (parsedError) {
    console.log({
      message: parsedError.message,
      status: parsedError.status,
      data: parsedError.data,
    });
  }
}
```

### TypeScript Support

```typescript
interface User {
  id: number;
  name: string;
}

// Get typed response data
const { data } = await api.get<User>("/users/1");
data.name; // TypeScript knows this is a string

// Error typing
try {
  await api.post<User>("/users");
} catch (error) {
  if (error instanceof FetcherError) {
    console.log(error.status); // Typed as number
    console.log(error.data); // Typed as any
  }
}
```

## API Reference

### `Fetcher`

#### Constructor Options

```typescript
interface FetcherOptions extends RequestInit {
  baseUrl?: string;
  onBefore?: BeforeHooks | BeforeHooks[];
  onAfter?: AfterHooks | AfterHooks[];
}
```

#### Methods

- `get<T>(path: string, options?: RequestInit): Promise<FetcherResponse<T>>`
- `post<T>(path: string, options?: RequestInit): Promise<FetcherResponse<T>>`
- `put<T>(path: string, options?: RequestInit): Promise<FetcherResponse<T>>`
- `delete<T>(path: string, options?: RequestInit): Promise<FetcherResponse<T>>`
- `addBeforeHook(hook: BeforeHooks): Fetcher`
- `addAfterHook(hook: AfterHooks): Fetcher`
- `removeBeforeHook(hook: BeforeHooks): Fetcher`
- `removeAfterHook(hook: AfterHooks): Fetcher`
- `clearHooks(): Fetcher`
- `parseError(error: Error): FetcherError | undefined`

## Migration Guide from v1.x to v2.0.0

### Breaking Changes

1. **Constructor Signature**

   ```typescript
   // v1.x
   const api = new Fetcher(baseUrl, headers);

   // v2.0.0
   const api = new Fetcher({
     baseUrl: "https://api.example.com",
     headers: {
       /* your headers */
     },
   });
   ```

2. **Hooks System**

   ```typescript
   // v1.x
   api.onBefore([
     () =>
       new Headers({
         /* headers */
       }),
   ]);

   // v2.0.0
   api.addBeforeHook(async (url, options) => {
     options.headers = {
       /* your headers */
     };
   });
   ```

3. **Response Format**

   ```typescript
   // v1.x
   const data = await api.get<User>("/users/1");

   // v2.0.0
   const { data, status, headers } = await api.get<User>("/users/1");
   ```

4. **Error Handling**

   ```typescript
   // v1.x
   try {
     await api.get("/users/1");
   } catch (error) {
     // Basic error with no additional context
   }

   // v2.0.0
   try {
     await api.get("/users/1");
   } catch (error) {
     const parsedError = api.parseError(error);
     // Rich error object with status, data, and headers
   }
   ```

### New Features in v2.0.0

- After hooks support via `onAfter` and `addAfterHook`
- Rich error objects with status codes and response data
- Chainable hook methods
- TypeScript-first approach with better type inference
- Automatic JSON parsing

## License

MIT
