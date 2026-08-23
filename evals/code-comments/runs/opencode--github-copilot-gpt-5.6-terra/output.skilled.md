```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;

  // Try the operation up to `attempts` times.
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      // Wait before another attempt, doubling the base delay each time.
      if (i < attempts - 1) {
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed; preserve the error from the final attempt.
  throw lastErr;
}
```
