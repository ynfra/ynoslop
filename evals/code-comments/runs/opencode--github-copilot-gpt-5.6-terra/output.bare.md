```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;

  // Retry the operation up to the requested number of attempts.
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      // Wait with exponential backoff plus jitter before the next attempt.
      if (i < attempts - 1) {
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed; preserve the last encountered error.
  throw lastErr;
}
```
