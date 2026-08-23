```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;

  // Try the operation until the maximum number of attempts is reached.
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      // Remember the latest error so it can be re-thrown if all attempts fail.
      lastErr = err;

      // Wait before retrying with exponential backoff plus a small random jitter.
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
