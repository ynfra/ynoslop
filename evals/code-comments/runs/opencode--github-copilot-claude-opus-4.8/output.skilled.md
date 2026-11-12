```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  // Holds the most recent error so it can be rethrown if every attempt fails.
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      // Success on any attempt returns immediately.
      return await fn();
    } catch (err) {
      lastErr = err;
      // Skip the wait after the final attempt; we're about to throw.
      if (i < attempts - 1) {
        // Exponential backoff (baseMs * 2^i) plus up to baseMs of jitter to
        // spread out retries from concurrent callers. With defaults: ~100ms,
        // then ~200ms, each plus 0–100ms random.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // All attempts exhausted; surface the last error to the caller.
  throw lastErr;
}
```
