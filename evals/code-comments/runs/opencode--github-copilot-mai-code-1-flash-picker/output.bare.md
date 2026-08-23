```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;

  // Try the operation up to the requested number of times.
  for (let i = 0; i < attempts; i++) {
    try {
      // Return the first successful result.
      return await fn();
    } catch (err) {
      // Remember the latest failure so it can be rethrown if all attempts fail.
      lastErr = err;

      // Wait with exponential backoff before retrying, unless this was the last attempt.
      if (i < attempts - 1) {
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Re-throw the last error after all retries have been exhausted.
  throw lastErr;
}
```
