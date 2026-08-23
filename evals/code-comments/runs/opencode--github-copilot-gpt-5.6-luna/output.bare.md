```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;

  // Try the operation until it succeeds or all attempts are exhausted.
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      // Wait with exponential backoff and jitter before the next attempt.
      if (i < attempts - 1) {
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Preserve and rethrow the error from the final failed attempt.
  throw lastErr;
}
```
